/**
 * Rate Limiter - 速率限制工具
 * 防止 API 被濫用
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 使用 Map 儲存速率限制記錄（記憶體型）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 清理過期記錄的間隔（每 5 分鐘）
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// 定期清理過期記錄
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitConfig {
  // 時間窗口內允許的最大請求次數
  maxRequests: number;
  // 時間窗口（毫秒）
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * 檢查並更新速率限制
 * @param identifier - 識別符（userId 或 IP）
 * @param config - 速率限制配置
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    maxRequests: 10, // 預設：10 次請求
    windowMs: 60 * 1000, // 預設：1 分鐘
  }
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // 獲取現有記錄
  const existing = rateLimitStore.get(key);

  // 如果沒有記錄或已過期，創建新記錄
  if (!existing || existing.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 檢查是否超過限制
  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
      error: `請求過於頻繁，請在 ${Math.ceil((existing.resetTime - now) / 1000)} 秒後重試`,
    };
  }

  // 增加計數
  existing.count++;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime,
  };
}

/**
 * 取得特定識別符的當前限制狀態
 */
export function getRateLimitStatus(identifier: string): RateLimitResult | null {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetTime < now) {
    return null;
  }

  return {
    allowed: existing.count < 10,
    remaining: Math.max(0, 10 - existing.count),
    resetTime: existing.resetTime,
  };
}

/**
 * 清除特定識別符的限制記錄（用於測試或管理）
 */
export function clearRateLimit(identifier: string): void {
  const key = `ratelimit:${identifier}`;
  rateLimitStore.delete(key);
}
