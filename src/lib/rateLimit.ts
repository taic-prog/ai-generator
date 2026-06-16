interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRequestMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const CLEANUP_INTERVAL = 1000;
let callsSinceCleanup = 0;

// 期限切れエントリを溜め続けるとインスタンス生存中にメモリが無制限に増えるため、定期的に掃除する
function cleanupExpiredEntries(now: number) {
  for (const [key, value] of ipRequestMap) {
    if (now > value.resetAt) {
      ipRequestMap.delete(key);
    }
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  callsSinceCleanup++;
  if (callsSinceCleanup >= CLEANUP_INTERVAL) {
    callsSinceCleanup = 0;
    cleanupExpiredEntries(now);
  }

  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}
