import OpenAI from 'openai';

const openai = process.env.NEXT_PUBLIC_TEST_MODE === 'true' 
  ? null 
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });

// 分類上下文映射
function getCategoryContext(category: string) {
  const contexts: { [key: string]: string } = {
    '日常': '日常生活情境，例如與家人朋友的日常對話',
    '購物': '購物情境，例如與店員的對話', 
    '學校': '學校情境，例如與同學老師的對話',
    '文件申辦': '銀行郵局情境，例如辦理各種手續的對話',
    '工作': '工作情境，例如與同事的職場對話',
  };
  return contexts[category] || '一般生活情境的對話';
}

export async function generateJapaneseContent(taskData: string) {
  // 測試模式返回假資料
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || !openai) {
    return `## 關聯單字

1. <ruby>商品<rt>しょうひん</rt></ruby> - 商品
例句：この<ruby>商品<rt>しょうひん</rt></ruby>は<ruby>人気<rt>にんき</rt></ruby>があります。 - 這個商品很受歡迎。
詞組：<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶ - 挑選商品
小對話：
A: この<ruby>商品<rt>しょうひん</rt></ruby>、おすすめですか。 - 這個商品推薦嗎？
B: はい、とても<ruby>人気<rt>にんき</rt></ruby>がありますよ。 - 是的，非常受歡迎喔。

2. <ruby>店員<rt>てんいん</rt></ruby> - 店員
例句：<ruby>店員<rt>てんいん</rt></ruby>さんが<ruby>親切<rt>しんせつ</rt></ruby>でした。 - 店員很親切。
詞組：<ruby>店員<rt>てんいん</rt></ruby>さんに<ruby>聞<rt>き</rt></ruby>く - 詢問店員
小對話：
A: すみません、<ruby>店員<rt>てんいん</rt></ruby>さんを<ruby>呼<rt>よ</rt></ruby>んでください。 - 不好意思，請幫我叫店員。
B: はい、すぐに<ruby>參<rt>まい</rt></ruby>ります。 - 好的，馬上就來。

## 日常對話

A: いらっしゃいませ。
歡迎光臨。

B: すみません、これはいくらですか。
不好意思，這個多少錢？

*這是測試模式的示範內容*`;
  }

  try {
    // 解析任務資料
    const lines = taskData.split('\n');
    const dateMatch = lines.find(line => line.includes('日期:'));
    const categoryMatch = lines.find(line => line.includes('分類:'));
    const nameMatch = lines.find(line => line.includes('任務名稱:'));
    const descMatch = lines.find(line => line.includes('詳細描述:'));

    const selectedDate = dateMatch?.split('日期:')[1]?.trim() || '';
    const category = categoryMatch?.split('分類:')[1]?.trim() || '';
    const title = nameMatch?.split('任務名稱:')[1]?.trim() || '';
    const description = descMatch?.split('詳細描述:')[1]?.trim() || '';

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "你是住在日本20年的資深日語專家，幫助剛到日本台灣留學生學習真正地道的日語。請生成符合日本人實際使用習慣的詞彙和表達方式，避免教科書式的簡單用法。所有日文都要使用 <ruby>漢字<rt>ひらがな</rt></ruby> 格式標記讀音。"
        },
        {
          role: "user",
          content: `請為以下任務生成日語學習內容：

任務資訊：
- 日期：${selectedDate}
- 分類：${category}
- 任務名稱：${title}
- 詳細描述：${description}

## 關聯單字（12個）

**🎯 核心要求：具體化、實用化**

1. **深度分析任務**：
   - 仔細分析任務名稱和描述中的每個關鍵詞
   - 如果提到「衣服」→ 列出：Tシャツ、ズボン、ワンピース、スカート、セーター、ジャケット等具體款式
   - 如果提到「清潔劑」→ 列出：洗剤、漂白剤、ガラスクリーナー、トイレ用洗剤、重曹、クエン酸等具體種類
   - 如果提到「買菜」→ 列出：野菜（にんじん、たまねぎ）、肉（牛肉、豚肉）、調味料等具體品項

2. **選詞標準**：
   - ✅ 必須是該任務會直接用到的名詞
   - ✅ 使用 JLPT N3-N2 程度的實用詞彙
   - ✅ 優先選擇日本日常生活中高頻使用的詞
   - ❌ 避免太抽象或太罕見的詞

3. **格式要求**：
每個單字必須包含：
- 單字本身（純名詞，不含助詞）
- 例句（15-20字的自然句子，展示實際用法）
- 詞組（包含該單字的實用片語或慣用表達）
- 小對話（2句，模擬真實對話場景，使用丁寧體）

**輸出格式：**
1. <ruby>単語<rt>たんご</rt></ruby> - 中文意思
例句：自然的日文例句（含ruby） - 中文翻譯
詞組：實用詞組（含ruby） - 中文翻譯
小對話：
A: 第一句對話（含ruby） - 中文翻譯
B: 回應句（含ruby） - 中文翻譯

請確保所有日文都使用 <ruby>漢字<rt>ひらがな</rt></ruby> 格式。`
        }
      ],
      max_completion_tokens: 2500,
      temperature: 0.5,  // 降低以提高速度和穩定性
    });

    return completion.choices[0]?.message?.content || '無法生成內容';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      throw new Error(`API 錯誤: ${error.message}`);
    }
    throw new Error('生成內容時發生錯誤，請檢查 API 金鑰設定');
  }
}

export default openai;