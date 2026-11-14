/** Only web addresses (http/https) are ever opened from user-supplied data. Anything else (javascript:, data:, file:) is dropped. */
export function safeUrl(u?: string | null): string {
  if (!u) return "";
  try {
    const x = new URL(String(u).trim(), "https://invalid.local");
    return x.protocol === "https:" || x.protocol === "http:" ? (x.hostname === "invalid.local" ? "" : x.toString()) : "";
  } catch { return ""; }
}
