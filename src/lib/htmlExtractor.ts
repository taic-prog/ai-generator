// コードブロック形式: ```html ... ``` が閉じていること
const CODE_BLOCK_REGEX = /```html\s*([\s\S]*?)```/;
// 生HTML形式: 最後の </html> まで貪欲マッチ（複数ブロックがある場合は末尾を取得）
const RAW_HTML_REGEX = /(<!DOCTYPE html[\s\S]*<\/html>)/i;

export function extractHtml(rawText: string): string | null {
  const codeBlockMatch = rawText.match(CODE_BLOCK_REGEX);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const rawMatch = rawText.match(RAW_HTML_REGEX);
  if (rawMatch) return rawMatch[1].trim();

  return null;
}

export function isHtmlComplete(rawText: string): boolean {
  // コードブロック形式が開始されている場合は ``` の閉じタグまで必要
  if (rawText.includes("```html")) {
    return CODE_BLOCK_REGEX.test(rawText);
  }
  // 生HTML形式は </html> の存在で判定
  return rawText.includes("</html>");
}
