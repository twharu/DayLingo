import { NextRequest, NextResponse } from 'next/server';
import { generateJapaneseContent } from '@/lib/openai';
import { authenticateRequest, getClientIP } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

// 新聞搜尋功能已移除，根據用戶要求不再生成新聞內容

// 測試模式的模擬內容 (新格式：12個單字 + 6個自然詞組 + 4句對話)
function generateMockContent(task: string) {
  return `## 關聯單字

1. <ruby>商品<rt>しょうひん</rt></ruby> - 商品
例句：この<ruby>商品<rt>しょうひん</rt></ruby>は<ruby>人気<rt>にんき</rt></ruby>があります。 - 這個商品很受歡迎。

2. <ruby>店員<rt>てんいん</rt></ruby> - 店員
例句：<ruby>店員<rt>てんいん</rt></ruby>さんが<ruby>親切<rt>しんせつ</rt></ruby>でした。 - 店員很親切。

3. <ruby>値段<rt>ねだん</rt></ruby> - 價格
例句：<ruby>値段<rt>ねだん</rt></ruby>が<ruby>安<rt>やす</rt></ruby>いです。 - 價格便宜。

4. <ruby>袋<rt>ふくろ</rt></ruby> - 袋子
例句：<ruby>袋<rt>ふくろ</rt></ruby>をください。 - 請給我袋子。

5. <ruby>領収書<rt>りょうしゅうしょ</rt></ruby> - 收據
例句：<ruby>領収書<rt>りょうしゅうしょ</rt></ruby>をもらいました。 - 拿到了收據。

6. <ruby>会計<rt>かいけい</rt></ruby> - 結帳
例句：<ruby>会計<rt>かいけい</rt></ruby>をお<ruby>願<rt>ねが</rt></ruby>いします。 - 麻煩結帳。

7. <ruby>割引<rt>わりびき</rt></ruby> - 折扣
例句：<ruby>割引<rt>わりびき</rt></ruby>がありますか。 - 有折扣嗎？

8. <ruby>現金<rt>げんきん</rt></ruby> - 現金
例句：<ruby>現金<rt>げんきん</rt></ruby>で<ruby>払<rt>はら</rt></ruby>います。 - 用現金付款。

9. <ruby>品質<rt>ひんしつ</rt></ruby> - 品質
例句：<ruby>品質<rt>ひんしつ</rt></ruby>が<ruby>良<rt>よ</rt></ruby>い。 - 品質很好。

10. <ruby>在庫<rt>ざいこ</rt></ruby> - 庫存
例句：<ruby>在庫<rt>ざいこ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>します。 - 確認庫存。

11. <ruby>試着<rt>しちゃく</rt></ruby> - 試穿
例句：<ruby>試着<rt>しちゃく</rt></ruby>してもいいですか。 - 可以試穿嗎？

12. <ruby>交換<rt>こうかん</rt></ruby> - 換貨
例句：<ruby>交換<rt>こうかん</rt></ruby>できますか。 - 可以換貨嗎？

## 常用詞組

1. <ruby>洗剤<rt>せんざい</rt></ruby>はどこにありますか - 洗潔精在哪裡
例句：すみません、<ruby>洗剤<rt>せんざい</rt></ruby>はどこにありますか。 - 不好意思，洗潔精在哪裡？

2. <ruby>重曹<rt>じゅうそう</rt></ruby>を<ruby>探<rt>さが</rt></ruby>しています - 在找小蘇打
例句：<ruby>重曹<rt>じゅうそう</rt></ruby>を<ruby>探<rt>さが</rt></ruby>していますが、<ruby>見<rt>み</rt></ruby>つかりません。 - 在找小蘇打，但找不到。

3. この<ruby>商品<rt>しょうひん</rt></ruby>の<ruby>使<rt>つか</rt></ruby>い<ruby>方<rt>かた</rt></ruby>を<ruby>教<rt>おし</rt></ruby>えてください - 請教我這個商品的用法
例句：すみません、この<ruby>商品<rt>しょうひん</rt></ruby>の<ruby>使<rt>つか</rt></ruby>い<ruby>方<rt>かた</rt></ruby>を<ruby>教<rt>おし</rt></ruby>えてください。 - 不好意思，請教我這個商品的用法。

4. もっと<ruby>大<rt>おお</rt></ruby>きいサイズはありますか - 有更大的尺寸嗎
例句：もっと<ruby>大<rt>おお</rt></ruby>きいサイズはありますか。 - 有更大的尺寸嗎？

5. <ruby>在庫<rt>ざいこ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>していただけますか - 可以幫我確認庫存嗎
例句：こちらの<ruby>在庫<rt>ざいこ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>していただけますか。 - 可以幫我確認這個的庫存嗎？

6. <ruby>別<rt>べつ</rt></ruby>の<ruby>色<rt>いろ</rt></ruby>もありますか - 還有其他顏色嗎
例句：<ruby>別<rt>べつ</rt></ruby>の<ruby>色<rt>いろ</rt></ruby>もありますか。 - 還有其他顏色嗎？

## 日常對話

A: あの、シャンプーってどこにありますか。
不好意思，洗髮精在哪裡？

B: 3<ruby>階<rt>かい</rt></ruby>の<ruby>日用品<rt>にちようひん</rt></ruby>コーナーですよ。
在3樓的日用品區喔。

A: ありがとうございます。この<ruby>商品<rt>しょうひん</rt></ruby>いくらですか。
謝謝。這個商品多少錢？

B: こちらは380<ruby>円<rt>えん</rt></ruby>です。<ruby>今<rt>いま</rt></ruby>セール<ruby>中<rt>ちゅう</rt></ruby>なんですよ。
這個是380日圓。現在正在特價中喔。

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
        { error: '請提供任務內容' },
        { status: 400 }
      );
    }

    let content: string;

    // 4. 檢查是否為測試模式
    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
      // 使用模擬內容
      content = generateMockContent(task);
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 2000));
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