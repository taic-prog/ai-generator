const CODE_BLOCK_REGEX = /```html\s*([\s\S]*?)```/;
const RAW_HTML_REGEX = /(<!DOCTYPE html[\s\S]*?<\/html>)/i;

export function extractHtml(rawText: string): string | null {
  const codeBlockMatch = rawText.match(CODE_BLOCK_REGEX);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const rawMatch = rawText.match(RAW_HTML_REGEX);
  if (rawMatch) return rawMatch[1].trim();

  return null;
}

export function isHtmlComplete(rawText: string): boolean {
  return rawText.includes("</html>");
}
