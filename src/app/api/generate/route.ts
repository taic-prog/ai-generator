import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { checkRateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { MODEL_NAME, MAX_PROMPT_LENGTH, AppStyle, APP_STYLES, AppTaste, APP_TASTES } from "@/types";

export const runtime = "nodejs";

// apiKeyは不変なので、リクエストごとに作り直さずモジュールスコープで再利用する
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

export async function POST(request: Request) {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return Response.json(
      { error: "リクエストが多すぎます。しばらく経ってから再試行してください。" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let prompt: string;
  let style: AppStyle;
  let taste: AppTaste;
  try {
    const body = await request.json();
    prompt = body.prompt;
    const validStyleIds = new Set<string>(APP_STYLES.map((s) => s.id));
    style = typeof body.style === "string" && validStyleIds.has(body.style)
      ? (body.style as AppStyle)
      : "dark";
    const validTasteIds = new Set<string>(APP_TASTES.map((t) => t.id));
    taste = typeof body.taste === "string" && validTasteIds.has(body.taste)
      ? (body.taste as AppTaste)
      : "cool";
  } catch {
    return Response.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return Response.json({ error: "プロンプトを入力してください" }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json({ error: `プロンプトは${MAX_PROMPT_LENGTH}文字以内にしてください` }, { status: 400 });
  }

  if (!client) {
    return Response.json({ error: "APIキーが設定されていません" }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const { signal } = request;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream(
          {
            model: MODEL_NAME,
            max_tokens: 8192,
            system: buildSystemPrompt(style, taste),
            messages: [{ role: "user", content: prompt }],
          },
          { signal }
        );

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }

        const finalMessage = await response.finalMessage();
        const usage = finalMessage.usage;
        const usageData = `data: ${JSON.stringify({
          type: "usage",
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
        })}\n\n`;
        controller.enqueue(encoder.encode(usageData));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        // AbortErrorはクライアント切断による正常なキャンセルのため、エラーSSEは送信しない
        if ((err as Error).name !== "AbortError") {
          console.error("Claude API呼び出し中にエラーが発生しました:", err);
          const errData = `data: ${JSON.stringify({
            type: "error",
            message: "生成中にエラーが発生しました。もう一度お試しください。",
          })}\n\n`;
          controller.enqueue(encoder.encode(errData));
        }
        try {
          controller.close();
        } catch {
          // ストリームが既に閉じている場合は無視する
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
