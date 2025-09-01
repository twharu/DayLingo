import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 分類上下文映射
function getCategoryContext(category: string) {
  const contexts: { [key: string]: string } = {
    '日常生活': '日常生活情境，例如與家人朋友的日常對話',
    '購物消費': '購物情境，例如與店員的對話', 
    '餐廳用餐': '餐廳情境，例如點餐和與服務生的對話',
    '交通出行': '交通情境，例如搭乘電車、計程車的對話',
    '學校生活': '學校情境，例如與同學老師的對話',
    '醫療健康': '醫療情境，例如與醫生護士的對話',
    '銀行郵局': '銀行郵局情境，例如辦理各種手續的對話',
    '工作相關': '工作情境，例如與同事的職場對話',
    '社交活動': '社交情境，例如參加活動或聚會的對話',
    '緊急情況': '緊急情境，例如求助或處理緊急事件的對話'
  };
  return contexts[category] || '一般生活情境的對話';
}

export async function generateJapaneseContent(taskData: string) {
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
          content: "你是專業的日語老師，專門幫助台灣留學生學習日語。請生成實用的日語學習內容，包括詞組、對話和新聞。所有日文都要使用 <ruby>漢字<rt>ひらがな</rt></ruby> 格式標記讀音。"
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

## 重要詞組
提供10個與此任務相關的實用詞組，請使用「動詞+助詞+名詞」的完整詞組格式：

**詞組格式範例：**
- <ruby>商品<rt>しょうひん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶ
- <ruby>店員<rt>てんいん</rt></ruby>に<ruby>聞<rt>き</rt></ruby>く
- <ruby>値段<rt>ねだん</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>する
- <ruby>買<rt>か</rt></ruby>い<ruby>物<rt>もの</rt></ruby>をする
- <ruby>袋<rt>ふくろ</rt></ruby>をもらう

每個詞組格式：
<ruby>詞組<rt>よみかた</rt></ruby> - 中文意思
例句：包含ruby標記的日文例句 - 中文翻譯

## 日常對話  
設計一段8句話的實用對話，使用N2-N1程度的日語，包含敬語。每句都要有日文（使用ruby標記）和中文翻譯。

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