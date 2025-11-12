import OpenAI from 'openai';

const openai = process.env.NEXT_PUBLIC_TEST_MODE === 'true'
  ? null
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });

// 分類上下文映射
// function getCategoryContext(category: string) {
//   const contexts: { [key: string]: string } = {
//     '日常': '日常生活情境，例如與家人朋友的日常對話',
//     '購物': '購物情境，例如與店員的對話',
//     '學校': '學校情境，例如與同學老師的對話',
//     '文件申辦': '銀行郵局情境，例如辦理各種手續的對話',
//     '工作': '工作情境，例如與同事的職場對話',
//   };
//   return contexts[category] || '一般生活情境的對話';
// }

export async function generateJapaneseContent(taskData: string) {
  // 測試模式返回假資料
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || !openai) {
    return `## 關聯單字

1. <ruby>商品<rt>しょうひん</rt></ruby> - 商品
例句：この<ruby>商品<rt>しょうひん</rt></ruby>は<ruby>人気<rt>にんき</rt></ruby>があります。 - 這個商品很受歡迎。
詞組：<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶ - 挑選商品

2. <ruby>店員<rt>てんいん</rt></ruby> - 店員
例句：<ruby>店員<rt>てんいん</rt></ruby>さんが<ruby>親切<rt>しんせつ</rt></ruby>でした。 - 店員很親切。
詞組：<ruby>店員<rt>てんいん</rt></ruby>さんに<ruby>聞<rt>き</rt></ruby>く - 詢問店員

3. <ruby>割引<rt>わりびき</rt></ruby> - 折扣
例句：<ruby>今日<rt>きょう</rt></ruby>は<ruby>割引<rt>わりびき</rt></ruby>セールです。 - 今天是折扣特賣。
詞組：<ruby>割引<rt>わりびき</rt></ruby>クーポン - 折扣券

*這是測試模式的示範內容*`;
  }

  try {
    // 解析待辦事項資料
    const lines = taskData.split('\n');
    const dateMatch = lines.find(line => line.includes('日期:'));
    const categoryMatch = lines.find(line => line.includes('分類:'));
    const nameMatch = lines.find(line => line.includes('待辦事項名稱:'));
    const descMatch = lines.find(line => line.includes('詳細描述:'));

    const selectedDate = dateMatch?.split('日期:')[1]?.trim() || '';
    const category = categoryMatch?.split('分類:')[1]?.trim() || '';
    const title = nameMatch?.split('待辦事項名稱:')[1]?.trim() || '';
    const description = descMatch?.split('詳細描述:')[1]?.trim() || '';

    console.log('🔍 [OpenAI] 開始生成內容，待辦事項:', { selectedDate, category, title, description });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "你是住在日本20年的資深日語專家，幫助剛到日本台灣留學生學習真正地道的日語。請生成符合日本人實際使用習慣的詞彙和表達方式。\n\n**重要限制：**\n- 絕對不要生成 JLPT N5-N4 的基礎詞彙（如：日本語、学校、行く、今日、勉強、食べる等初級教科書會教的詞）\n- 只生成 JLPT N2-N1 程度且「在日本生活中實際會用到」的詞彙\n\n所有日文都要使用 <ruby>漢字<rt>ひらがな</rt></ruby> 格式標記讀音。"
        },
        {
          role: "user",
          content: `請為以下待辦事項生成日語學習內容：

待辦事項資訊：
- 日期：${selectedDate}
- 分類：${category}
- 待辦事項名稱：${title}
- 詳細描述：${description}

## 關聯單字

**🎯 核心原則：只生成「這個待辦事項特有」的詞彙**

**🚨 重要三步驟：**
1. **場景模擬**：在腦中完整模擬執行這個待辦事項的過程
2. **提取專有詞**：只記錄「這個待辦事項才會用到」的專有名詞
3. **排除通用詞**：刪除「任何類似場景都會用到」的通用詞

**✅ 應該生成的詞彙：**
- 這個待辦事項會直接接觸到的**具體物品名稱**（N2-N1程度）
- 執行這個待辦事項時會說出的**生活實用詞彙**
- 只有這個情境才會看到/聽到的**特定表達方式**
- 必須是完整的日文詞彙（漢字+平假名、片假名組合）
- **絕對不能是初級教科書會教的基礎詞**

**❌ 絕對不要生成的詞彙：**
- 購物通用詞：店員、レジ、会計、値段、在庫、領収書、袋、現金、カード、試用品
- 餐廳通用詞：注文、予約、席、お冷
- 基礎詞彙：これ、あれ、いくら、ください、ありがとう
- 英文縮寫或代號：SPF、UV、PA、N95 等（雖然會看到但不是日文詞彙）

**📋 範例對比：**

待辦事項：「去拉麵店吃拉麵」
✅ 應該生成（N2-N1程度，情境專屬）：
- 醤油ラーメン（醬油拉麵）
- とんこつ（豚骨湯底）
- チャーシュー（叉燒）
- 煮卵（溏心蛋）
- 替え玉（加麵）
- 麺の硬さ（麵的軟硬度）
- バリカタ（超硬麵）

❌ 不要生成（通用詞或太基礎）：
- 注文、メニュー、会計（任何餐廳都會用）
- ラーメン、食べる、美味しい（N5基礎詞）

待辦事項：「去日文課程面試」
✅ 應該生成（N2-N1程度，情境專屬）：
- 面接（めんせつ）- 面試
- 履歴書（りれきしょ）- 履歷表
- 志望動機（しぼうどうき）- 申請動機
- 入学手続き（にゅうがくてつづき）- 入學手續

❌ 不要生成（太基礎）：
- 日本語、学校、勉強（N5基礎詞）
- 先生、教室、行く（初級教科書詞彙）

**📊 生成數量：固定 9 個**
- 必須生成恰好 9 個單字，不多不少
- 每個單字都必須是高品質、高關聯度的 N2-N1 詞彙

**🚨 質量優先：寧可刪除低關聯度的詞，也不要加入通用詞或基礎詞**

**自我檢查機制：**
生成完畢後，請自問：
1. 如果換成類似的待辦事項（例如去便利店買飲料），這些詞還會用到嗎？

2. **格式要求**：
每個單字必須包含：
- 單字本身（純名詞，不含助詞）
- 例句（15-20字的自然句子，展示實際用法）
- 詞組（包含該單字的實用片語或慣用表達）

**嚴格輸出格式（每個單字必須完整包含以下3個部分）：**

1. <ruby>単語<rt>たんご</rt></ruby> - 中文意思
例句：自然的日文例句（含ruby） - 中文翻譯
詞組：實用詞組（含ruby） - 中文翻譯

**完整範例：**
1. <ruby>割引<rt>わりびき</rt></ruby> - 折扣
例句：<ruby>今日<rt>きょう</rt></ruby>は<ruby>割引<rt>わりびき</rt></ruby>セールです。 - 今天是折扣特賣。
詞組：<ruby>割引<rt>わりびき</rt></ruby>クーポン - 折扣券

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
- ❌ 「<ruby>エアコン<rt>えあこん</rt></ruby>の温度」（片假名不應標注，漢字沒標注）`
        }
      ],
      max_completion_tokens: 2500,
      temperature: 0.7,  // 稍微降低以提高穩定性
    });

    const generatedContent = completion.choices[0]?.message?.content || '無法生成內容';
    console.log('✅ [OpenAI] 生成完成，內容長度:', generatedContent.length, '字');
    console.log('📝 [OpenAI] 生成內容預覽:', generatedContent.substring(0, 200) + '...');

    return generatedContent;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      throw new Error(`API 錯誤: ${error.message}`);
    }
    throw new Error('生成內容時發生錯誤，請檢查 API 金鑰設定');
  }
}

export default openai;
