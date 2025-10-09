/**
 * API 身份驗證工具
 * 驗證 Firebase Auth token 並確保請求來自已登入的用戶
 */

import { NextRequest } from 'next/server';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * 驗證請求是否包含有效的用戶 ID
 * 注意：這是簡化版本，在生產環境中應該使用 Firebase Admin SDK 驗證 token
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // 從 header 中獲取 userId
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return {
        authenticated: false,
        error: '未提供用戶身份'
      };
    }

    // 基本驗證：檢查 userId 格式
    // Firebase Auth UID 通常是 28 個字元的字串
    if (userId.length < 10 || userId.length > 128) {
      return {
        authenticated: false,
        error: '無效的用戶身份'
      };
    }

    // 驗證成功
    return {
      authenticated: true,
      userId
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: '身份驗證失敗'
    };
  }
}

/**
 * 獲取客戶端 IP 地址（用於 rate limiting）
 */
export function getClientIP(request: NextRequest): string {
  // 優先使用 Vercel 的 header
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 降級使用 request IP（不是所有環境都支援）
  return 'unknown';
}
