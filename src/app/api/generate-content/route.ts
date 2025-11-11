import { NextRequest, NextResponse } from 'next/server';
import { generateJapaneseContent } from '@/lib/openai';
import { authenticateRequest } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

// 新聞搜尋功能已移除，根據用戶要求不再生成新聞內容

// 測試模式的模擬內容 (新格式：9個單字，每個包含例句、詞組)
function generateMockContent() {
  return `## 關聯單字

1. <ruby>商品<rt>しょうひん</rt></ruby> - 商品
例句：この<ruby>商品<rt>しょうひん</rt></ruby>は<ruby>人気<rt>にんき</rt></ruby>があります。 - 這個商品很受歡迎。
詞組：<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶ - 挑選商品

2. <ruby>店員<rt>てんいん</rt></ruby> - 店員
例句：<ruby>店員<rt>てんいん</rt></ruby>さんが<ruby>親切<rt>しんせつ</rt></ruby>でした。 - 店員很親切。
詞組：<ruby>店員<rt>てんいん</rt></ruby>さんに<ruby>聞<rt>き</rt></ruby>く - 詢問店員

3. <ruby>値段<rt>ねだん</rt></ruby> - 價格
例句：<ruby>値段<rt>ねだん</rt></ruby>が<ruby>安<rt>やす</rt></ruby>いです。 - 價格便宜。
詞組：<ruby>値段<rt>ねだん</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>する - 確認價格

4. <ruby>袋<rt>ふくろ</rt></ruby> - 袋子
例句：<ruby>袋<rt>ふくろ</rt></ruby>をください。 - 請給我袋子。
詞組：<ruby>袋<rt>ふくろ</rt></ruby>に<ruby>入<rt>い</rt></ruby>れる - 放進袋子裡

5. <ruby>領収書<rt>りょうしゅうしょ</rt></ruby> - 收據
例句：<ruby>領収書<rt>りょうしゅうしょ</rt></ruby>をもらいました。 - 拿到了收據。
詞組：<ruby>領収書<rt>りょうしゅうしょ</rt></ruby>を<ruby>発行<rt>はっこう</rt></ruby>する - 開立收據

6. <ruby>会計<rt>かいけい</rt></ruby> - 結帳
例句：<ruby>会計<rt>かいけい</rt></ruby>をお<ruby>願<rt>ねが</rt></ruby>いします。 - 麻煩結帳。
詞組：<ruby>会計<rt>かいけい</rt></ruby>に<ruby>向<rt>む</rt></ruby>かう - 前往結帳處

7. <ruby>割引<rt>わりびき</rt></ruby> - 折扣
例句：<ruby>割引<rt>わりびき</rt></ruby>がありますか。 - 有折扣嗎？
詞組：<ruby>割引<rt>わりびき</rt></ruby>を<ruby>使<rt>つか</rt></ruby>う - 使用折扣

8. <ruby>現金<rt>げんきん</rt></ruby> - 現金
例句：<ruby>現金<rt>げんきん</rt></ruby>で<ruby>払<rt>はら</rt></ruby>います。 - 用現金付款。
詞組：<ruby>現金<rt>げんきん</rt></ruby>で<ruby>支払<rt>しはら</rt></ruby>う - 現金支付

9. <ruby>品質<rt>ひんしつ</rt></ruby> - 品質
例句：<ruby>品質<rt>ひんしつ</rt></ruby>が<ruby>良<rt>よ</rt></ruby>い。 - 品質很好。
詞組：<ruby>品質<rt>ひんしつ</rt></ruby>を<ruby>確<rt>たし</rt></ruby>かめる - 確認品質

***此為測試模式生成的內容***`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 身份驗證
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || '身份驗證失敗' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;

    // 2. 速率限制檢查（每分鐘最多 10 次請求）
    const rateLimitResult = checkRateLimit(userId, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 分鐘
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || '請求過於頻繁',
          resetTime: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // 3. 驗證請求內容
    const { task } = await request.json();

    if (!task) {
      return NextResponse.json(
        { error: '請提供待辦事項內容' },
        { status: 400 }
      );
    }

    let content: string;

    // 4. 檢查是否為測試模式
    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
      // 使用模擬內容
      content = generateMockContent();
      // 模擬 API 延遲（讓用戶看到 loading 動畫）
      await new Promise(resolve => setTimeout(resolve, 4000));
    } else {
      // 使用真實 API 生成內容
      content = await generateJapaneseContent(task);
    }

    // 5. 返回結果（包含速率限制資訊）
    return NextResponse.json(
      {
        content,
        timestamp: new Date().toISOString(),
        mode: process.env.NEXT_PUBLIC_TEST_MODE === 'true' ? 'test' : 'production'
      },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '生成內容時發生錯誤' },
      { status: 500 }
    );
  }
}