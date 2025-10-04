import { NextRequest, NextResponse } from 'next/server';
import { generateJapaneseContent } from '@/lib/openai';
import { authenticateRequest, getClientIP } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

// 新聞搜尋功能已移除，根據用戶要求不再生成新聞內容

// 測試模式的模擬內容 (N2程度，完整詞組格式，ruby標記)
function generateMockContent(task: string) {
  return `## 重要詞組

1. <ruby>商品<rt>しょうひん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶ - 選擇商品
例句：<ruby>品質<rt>ひんしつ</rt></ruby>の<ruby>良<rt>よ</rt></ruby>い<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶのは<ruby>大切<rt>たいせつ</rt></ruby>だ。 - 選擇品質好的商品很重要。

2. <ruby>値段<rt>ねだん</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>する - 確認價格
例句：<ruby>購入<rt>こうにゅう</rt></ruby><ruby>前<rt>まえ</rt></ruby>に<ruby>必<rt>かなら</rt></ruby>ず<ruby>値段<rt>ねだん</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>する。 - 購買前一定要確認價格。

3. <ruby>店員<rt>てんいん</rt></ruby>に<ruby>聞<rt>き</rt></ruby>く - 詢問店員
例句：わからないことがあったら<ruby>店員<rt>てんいん</rt></ruby>に<ruby>聞<rt>き</rt></ruby>いてみよう。 - 有不懂的事情就問店員吧。

4. <ruby>買<rt>か</rt></ruby>い<ruby>物<rt>もの</rt></ruby>をする - 購物
例句：<ruby>週末<rt>しゅうまつ</rt></ruby>に<ruby>近所<rt>きんじょ</rt></ruby>のスーパーで<ruby>買<rt>か</rt></ruby>い<ruby>物<rt>もの</rt></ruby>をする。 - 週末在附近的超市購物。

5. <ruby>袋<rt>ふくろ</rt></ruby>をもらう - 拿袋子
例句：エコバッグを<ruby>忘<rt>わす</rt></ruby>れたので<ruby>袋<rt>ふくろ</rt></ruby>をもらった。 - 忘記帶環保袋所以拿了袋子。

6. <ruby>商品<rt>しょうひん</rt></ruby>を<ruby>比較<rt>ひかく</rt></ruby>する - 比較商品
例句：<ruby>同<rt>おな</rt></ruby>じような<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>比較<rt>ひかく</rt></ruby>してから<ruby>決<rt>き</rt></ruby>める。 - 比較類似商品後再決定。

7. <ruby>領収書<rt>りょうしゅうしょ</rt></ruby>をもらう - 拿收據
例句：<ruby>経費<rt>けいひ</rt></ruby>のため<ruby>領収書<rt>りょうしゅうしょ</rt></ruby>をもらった。 - 為了報帳拿了收據。

8. <ruby>商品<rt>しょうひん</rt></ruby>を<ruby>返品<rt>へんぴん</rt></ruby>する - 退貨商品
例句：<ruby>不良品<rt>ふりょうひん</rt></ruby>だったので<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>返品<rt>へんぴん</rt></ruby>した。 - 因為是不良品所以退了貨。

9. カードで<ruby>支払<rt>しはら</rt></ruby>う - 用卡片付款
例句：カードで<ruby>支払<rt>しはら</rt></ruby>いを<ruby>完了<rt>かんりょう</rt></ruby>した。 - 用卡片完成了付款。

10. <ruby>場所<rt>ばしょ</rt></ruby>を<ruby>聞<rt>き</rt></ruby>く - 詢問位置
例句：シャンプーの<ruby>場所<rt>ばしょ</rt></ruby>を<ruby>店員<rt>てんいん</rt></ruby>に<ruby>聞<rt>き</rt></ruby>いた。 - 向店員詢問洗髮精的位置。

## 日常對話

A: あの、シャンプーってどこにありますか？
不好意思，洗髮精在哪裡？

B: あっ、3<ruby>階<rt>かい</rt></ruby>の<ruby>日用品<rt>にちようひん</rt></ruby>コーナーですね。エレベーターで<ruby>上<rt>あ</rt></ruby>がってすぐ<ruby>左<rt>ひだり</rt></ruby>です。
啊，在3樓的日用品區。搭電梯上去馬上左轉就是。

A: ありがとうございます！あと、この<ruby>商品<rt>しょうひん</rt></ruby>いくらでしたっけ？
謝謝！還有，這個商品多少錢？

B: えーっと、こちらは380<ruby>円<rt>えん</rt></ruby>になります。<ruby>今<rt>いま</rt></ruby>セール<ruby>中<rt>ちゅう</rt></ruby>なんですよ。
呃，這個是380日圓。現在正在特價中。

A: お<ruby>得<rt>とく</rt></ruby>ですね！じゃあこれください。<ruby>現金<rt>げんきん</rt></ruby>で。
很划算呢！那我要這個。用現金。

B: ありがとうございます。<ruby>袋<rt>ふくろ</rt></ruby>はいかがしますか？
謝謝。袋子要怎麼辦？

*🤖 此為測試模式生成的內容*`;
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