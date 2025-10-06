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

2. <ruby>店員<rt>てんいん</rt></ruby> - 店員
例句：<ruby>店員<rt>てんいん</rt></ruby>さんが<ruby>親切<rt>しんせつ</rt></ruby>でした。 - 店員很親切。

## 常用詞組

1. <ruby>商品<rt>しょうひん</rt></ruby>を<ruby>吟味<rt>ぎんみ</rt></ruby>する - 仔細挑選商品（一般用語）
例句：<ruby>時間<rt>じかん</rt></ruby>をかけて<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>吟味<rt>ぎんみ</rt></ruby>した。 - 花時間仔細挑選了商品。

2. お<ruby>買<rt>か</rt></ruby>い<ruby>物<rt>もの</rt></ruby>を<ruby>済<rt>す</rt></ruby>ませる - 完成購物（自然表達）
例句：<ruby>早<rt>はや</rt></ruby>くお<ruby>買<rt>か</rt></ruby>い<ruby>物<rt>もの</rt></ruby>を<ruby>済<rt>す</rt></ruby>ませたい。 - 想快點完成購物。

## 日常對話

A: いらっしゃいませ。
歡迎光臨。

B: すみません、これはいくらですか。
不好意思，這個多少錢？

A: それは<ruby>千円<rt>せんえん</rt></ruby>です。
那個是一千日圓。

B: ありがとうございます。
謝謝。

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

請生成以下內容：

## 關聯單字
提供12個與此任務**直接相關**的基礎單字：

**重要要求：**
- **必須仔細閱讀任務名稱和詳細描述，深入分析其中涉及的所有具體物品、行動、地點**
- **如果任務提到某個類別（如「清潔用品」），必須列出該類別的各種具體品項**
- **盡可能詳細、多樣化，充分利用12個單字的空間**

**具體範例：**
- 任務：「買清潔用品」→ 應列出各種清潔用品（包含常用的）：
  洗剤、スポンジ、雑巾、ブラシ、モップ、バケツ、ゴム手袋、重曹（小蘇打）、クエン酸、漂白剤、ガラスクリーナー、トイレ用洗剤
- 任務：「買衣架」→ 應列出各種衣架和相關用品：
  ハンガー、物干し竿、洗濯バサミ、ハンガーラック、すべらないハンガー、ズボン用ハンガー等
- 任務：「去超市買食材」→ 應列出各種食材：
  野菜、肉、魚、調味料、米、卵等

- 任務名稱和描述中的關鍵名詞一定要包含（轉換成日文）
- 純單字，不含助詞或動詞變化
- 使用JLPT N2程度的詞彙

每個單字格式：
<ruby>単語<rt>たんご</rt></ruby> - 中文意思
例句：包含ruby標記的自然日文例句 - 中文翻譯

## 常用詞組
提供6個與此任務**場景直接相關**的實用日語詞組表達：

**重要要求：**
- **必須基於任務描述的具體場景和行動生成詞組**
- **詞組要實用、具體，避免過於基礎簡單的表達**
- **使用丁寧體（ます形）結尾，保持禮貌但自然的表達**
- **避免過度僵硬的敬語或教科書式表達**
- 優先選擇包含任務相關名詞的完整詞組

**實用表達範例（請模仿這種風格）：**
- <ruby>洗剤<rt>せんざい</rt></ruby>はどこにありますか（洗潔精在哪裡）
- <ruby>重曹<rt>じゅうそう</rt></ruby>を<ruby>探<rt>さが</rt></ruby>しています（在找小蘇打）
- この<ruby>商品<rt>しょうひん</rt></ruby>の<ruby>使<rt>つか</rt></ruby>い<ruby>方<rt>かた</rt></ruby>を<ruby>教<rt>おし</rt></ruby>えてください（請教我這個商品的用法）
- もっと<ruby>大<rt>おお</rt></ruby>きいサイズはありますか（有更大的尺寸嗎）
- <ruby>在庫<rt>ざいこ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>していただけますか（可以幫我確認庫存嗎）

每個詞組格式：
<ruby>詞組<rt>よみかた</rt></ruby> - 中文意思
例句：包含ruby標記的自然日文例句 - 中文翻譯

## 日常對話
設計一段**與此任務場景高度相關**的真實日語對話（恰好2句）：

**對話要求：**
- **對話內容必須直接反映任務描述的具體場景**
- 例如：任務是「去大創買清潔用品」→ 對話中應該提到具體的清潔用品、詢問位置等
- 例如：任務是「買衣架」→ 對話中應該提到衣架、數量、種類等
- 恰好2句對話（A說1句，B說1句）
- **使用丁寧體（ます形、です形）結尾，保持禮貌的表達**
- 可以包含適當的語氣詞（よ、ね等）和感嘆詞（あっ、えーっと等）
- 避免過於隨便的口語或省略形

每句都要有日文（使用ruby標記）和中文翻譯。

請確保所有日文都使用ruby標記格式。`
        }
      ],
      max_completion_tokens: 2500,
      temperature: 0.7,
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