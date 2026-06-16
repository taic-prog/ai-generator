export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Safari では click() がダウンロードを非同期スケジュールするため遅延して revoke する
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
