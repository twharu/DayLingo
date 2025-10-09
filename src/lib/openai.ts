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
      model: "gpt-4o",
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

## 關聯單字

**🚨 重要：必須生成完整的 12 個單字，不能少於 12 個**
**🚨 詞彙組合要求：12個單字中至少 4-5 個必須是外來語（カタカナ詞彙）**

**🎯 核心要求：具體化、細分化、實用化、多樣化**

1. **深度分析任務並細分類別**：
   - 仔細分析任務描述中的每個關鍵詞，並列出該類別下的**具體產品/具體類型**

   **重要：要列出具體的產品名稱，不要只列籠統的分類詞，並且要包含外來語**

   範例（注意外來語和漢語詞的平衡）：
   - 如果提到「防曬」→ 列出具體產品（混合外來語和漢語詞）：
     * サンスクリーン（sunscreen 防曬乳）【外來語】
     * 日焼け止めスプレー（防曬噴霧）
     * UVカットクリーム（UV cut cream 防曬霜）【外來語】
     * 日焼け止めスティック（防曬棒）
     * アームカバー（arm cover 防曬袖套）【外來語】

   - 如果提到「胃藥/保健品」→ 列出具體藥品（混合外來語和漢語詞）：
     * 胃薬（いやく）- 胃藥
     * サプリメント（supplement 營養補充品）【外來語】
     * 胃腸薬（いちょうやく）- 胃腸藥
     * ビタミン剤（vitamin 維他命）【外來語】
     * 整腸剤（せいちょうざい）- 整腸藥

   - 如果提到「清潔用品」→ 列出具體產品（混合外來語和漢語詞）：
     * シャンプー（shampoo 洗髮精）【外來語】
     * コンディショナー（conditioner 潤髮乳）【外來語】
     * 洗剤（せんざい）- 清潔劑
     * ボディソープ（body soap 沐浴乳）【外來語】

2. **選詞標準**：
   - ✅ 必須是該任務會直接購買/使用的**具體產品名稱**
   - ✅ 使用 JLPT N2-N1 程度的實用詞彙，包含專業術語
   - ✅ 每個關鍵詞要深入挖掘，列出 3-4 個相關的具體產品
   - ✅ **必須包含外來語（カタカナ）詞彙，12個單字中至少4-5個是外來語**
   - ✅ 平衡漢語詞、和語詞、外來語的組合
   - ❌ 避免太籠統的分類詞（如只寫「防曬」而不寫具體產品）
   - ❌ 避免太基礎、學生已經會的簡單詞
   - ❌ 避免全部都是漢字詞，必須包含片假名外來語

**🚨 再次強調：請確保生成完整的 12 個單字，其中至少 4-5 個是外來語（カタカナ），每個單字都包含：單字本身、例句、詞組、小對話（A+B兩句）**

3. **格式要求**：
每個單字必須包含：
- 單字本身（純名詞，不含助詞）
- 例句（15-20字的自然句子，展示實際用法）
- 詞組（包含該單字的實用片語或慣用表達）
- 小對話（必須2句：A句 + B句，模擬真實對話場景，使用丁寧體）

**嚴格輸出格式（每個單字必須完整包含以下5個部分）：**

1. <ruby>単語<rt>たんご</rt></ruby> - 中文意思
例句：自然的日文例句（含ruby） - 中文翻譯
詞組：實用詞組（含ruby） - 中文翻譯
小對話：
A: 第一句對話（含ruby） - 中文翻譯
B: 回應句（含ruby） - 中文翻譯

**完整範例：**
1. <ruby>割引<rt>わりびき</rt></ruby> - 折扣
例句：<ruby>今日<rt>きょう</rt></ruby>は<ruby>割引<rt>わりびき</rt></ruby>セールです。 - 今天是折扣特賣。
詞組：<ruby>割引<rt>わりびき</rt></ruby>クーポン - 折扣券
小對話：
A: <ruby>割引<rt>わりびき</rt></ruby>はありますか。 - 有折扣嗎？
B: はい、30%オフです。 - 有的，打七折。

**🚨 重要：讀音標注規則**
- **只有漢字需要標注讀音**，平假名和片假名絕對不要標注
- 使用格式：<ruby>漢字<rt>ひらがな</rt></ruby>
- 片假名詞彙（カタカナ）直接寫，不需要任何標注

**正確範例：**
- ✅ 「この<ruby>商品<rt>しょうひん</rt></ruby>は<ruby>人気<rt>にんき</rt></ruby>があります」
- ✅ 「<ruby>割引<rt>わりびき</rt></ruby>クーポン」（クーポン是片假名，不標注）
- ✅ 「エアコンの<ruby>温度<rt>おんど</rt></ruby>」（エアコン是片假名，不標注）

**錯誤範例：**
- ❌ 「この商品は人気があります」（漢字沒有標注）
- ❌ 「<ruby>割引<rt>わりびき</rt></ruby><ruby>クーポン<rt>くーぽん</rt></ruby>」（片假名不應標注）
- ❌ 「<ruby>エアコン<rt>えあこん</rt></ruby>の温度」（片假名不應標注，漢字沒標注）

## 日常對話

生成2-3句與任務相關的實用對話，使用${getCategoryContext(category)}：
- 每句對話格式：日文句子 - 中文翻譯
- 使用丁寧體
- 所有漢字必須標注讀音`
        }
      ],
      max_completion_tokens: 2800,
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