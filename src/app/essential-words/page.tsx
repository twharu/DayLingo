'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HamburgerMenu from '@/lib/components/HamburgerMenu';

// 預設情境單字資料
const essentialWords = {
  '區役所/市役所手續': {
    tips: [
      '到達日本後14天內必須辦理遷入手續',
      '準備文件：在留卡、護照、學生證/在學證明、印章',
      '留學生可以申請國民健康保險減免及年金暫緩繳交'
    ],
    words: [
      { word: '住民票', reading: 'じゅうみんひょう', meaning: '住民票' },
      { word: '転入届', reading: 'てんにゅうとどけ', meaning: '遷入申請書' },
      { word: '印鑑', reading: 'いんかん', meaning: '印章' },
      { word: '印鑑登録', reading: 'いんかんとうろく', meaning: '印章登記' },
      { word: '身分証明書', reading: 'みぶんしょうめいしょ', meaning: '身分證明文件' },
      { word: '在留カード', reading: 'ざいりゅうかーど', meaning: '在留卡' },
      { word: '学生証', reading: 'がくせいしょう', meaning: '學生證' },
      { word: 'マイナンバーカード', reading: 'まいなんばーかーど', meaning: '日本的個人號碼卡（類似身分證）' },
      { word: '国民健康保険', reading: 'こくみんけんこうほけん', meaning: '國民健康保險' },
      { word: '年金', reading: 'ねんきん', meaning: '年金' },
      { word: '学生納付特例', reading: 'がくせいのうふとくれい', meaning: '學生繳納特例' },
      { word: '減免申請', reading: 'げんめんしんせい', meaning: '減免申請' },
      { word: '手続きをする', reading: 'てつづきをする', meaning: '辦手續、申請' },
      { word: '申請書', reading: 'しんせいしょ', meaning: '申請書' },
      { word: '窓口', reading: 'まどぐち', meaning: '櫃檯' },
      { word: '受付', reading: 'うけつけ', meaning: '受理、接待' },
    ],
    phrases: [
      '転入届を出したいです - 我想要提出遷入申請',
      '学生納付特例を申請したいです - 我想要申請學生繳納特例',
      '減免申請をしたいです - 我想要申請減免',
    ]
  },
  '租房找房': {
    tips: [
      '初期費用通常是房租的3-6倍（敷金+禮金+仲介費+首月房租）',
      '需要保證人或保證公司，外國人多使用保證公司',
      '租屋後，水電瓦斯需自行打電話或線上申請開通',
      '可利用 Suumo、at home 等網站找房',
      '注意管理費、停車費等額外費用'
    ],
    words: [
      { word: '賃貸', reading: 'ちんたい', meaning: '租賃' },
      { word: '敷金', reading: 'しききん', meaning: '押金（退租可能退回一部分）' },
      { word: '礼金', reading: 'れいきん', meaning: '禮金（送給房東，通常不退還）' },
      { word: '更新料', reading: 'こうしんりょう', meaning: '租約更新費（續約時需支付）' },
      { word: '仲介手数料', reading: 'ちゅうかいてすうりょう', meaning: '仲介手續費' },
      { word: '火災保険', reading: 'かさいほけん', meaning: '火災保險' },
      { word: '家賃', reading: 'やちん', meaning: '房租' },
      { word: '管理費', reading: 'かんりひ', meaning: '管理費' },
      { word: '共益費', reading: 'きょうえきひ', meaning: '共益費' },
      { word: '契約書', reading: 'けいやくしょ', meaning: '契約書' },
      { word: '保証人', reading: 'ほしょうにん', meaning: '保證人' },
      { word: '保証会社', reading: 'ほしょうかいしゃ', meaning: '保證公司' },
      { word: '不動産屋', reading: 'ふどうさんや', meaning: '房仲業者' },
      { word: 'ワンルーム', reading: 'わんるーむ', meaning: '套房' },
      { word: '駅近', reading: 'えきちか', meaning: '靠近車站' },
      { word: '内見', reading: 'ないけん', meaning: '看房' },
      { word: '電気', reading: 'でんき', meaning: '電力' },
      { word: 'ガス', reading: 'がす', meaning: '瓦斯' },
      { word: '水道', reading: 'すいどう', meaning: '自來水' },
      { word: 'インターネット', reading: 'いんたーねっと', meaning: '網路' },
      { word: '開通手続き', reading: 'かいつうてつづき', meaning: '開通手續' },
    ],
    phrases: [
      '部屋を探しています - 我在找房子',
      '内見をお願いします - 請讓我看房',
      'この部屋を見学できますか - 我可以看這間房子嗎？',
      '更新料はいくらですか - 租約更新費多少錢？'
    ]
  },
  '便利商店': {
    tips: [
      '可以繳水電瓦斯費等費用',
      '可以影印、列印住民票',
      '7-11結帳時需自行點選櫃檯機器上付款方式（現金、信用卡、電子支付）等，在進行結帳'
    ],
    words: [
      { word: 'レジ', reading: 'れじ', meaning: '收銀台' },
      { word: 'レシート', reading: 'れしーと', meaning: '收據' },
      { word: '袋', reading: 'ふくろ', meaning: '袋子' },
      { word: 'おしぼり', reading: 'おしぼり', meaning: '濕紙巾' },
      { word: 'お箸', reading: 'おはし', meaning: '筷子' },
      { word: 'スプーン', reading: 'すぷーん', meaning: '湯匙' },
      { word: '温める', reading: 'あたためる', meaning: '加熱' },
      { word: '住民票の写し', reading: 'じゅうみんひょうのうつし', meaning: '住民票影本' },
      { word: 'ATM', reading: 'えーてぃーえむ', meaning: '提款機' },
      { word: 'クレジットカード', reading: 'くれじっとかーど', meaning: '信用卡' },
      { word: '電子マネー', reading: 'でんしまねー', meaning: '電子支付' },
      { word: 'Suica/ICOCA', reading: 'すいか／いこか', meaning: '交通IC卡' }

    ],
    phrases: [
      '温めてください - 請幫我加熱',
      '袋はいりません - 不用袋子',
      'お箸/おしぼりをください - 請給我筷子/濕紙巾',
      'クレジットカードでお願いします - 我要用信用卡付款',
      'Suicaで払います - 用Suica支付',
      '住民票を印刷したいです - 我想列印住民票'
    ]
  },
  '餐廳點餐': {
    tips: [
      '日本餐廳通常都是提供冰水，冰水的日文是「おひや」，可以說「おひやください」',
      '有些餐廳（例如拉麵店），要先在點餐機購買餐券再入座'
    ],
    words: [
      { word: 'メニュー', reading: 'メニュー', meaning: '菜單' },
      { word: '注文', reading: 'ちゅうもん', meaning: '點餐' },
      { word: '定食', reading: 'ていしょく', meaning: '定食' },
      { word: '麺の固さ', reading: 'メンのかたさ', meaning: '麵的硬度' },
      { word: 'カタ麺', reading: 'かためん', meaning: '硬麵' },
      { word: 'お冷や', reading: 'おひや', meaning: '冰水' },
      { word: 'お会計', reading: 'おかいけい', meaning: '結帳' },
      { word: '現金', reading: 'げんきん', meaning: '現金' },
      { word: 'クレジットカード', reading: 'クレジットカード', meaning: '信用卡' },
    ],
    phrases: [
      'すみません、注文いいですか - 不好意思，我要點餐',
      '麺の固さはどうしますか - 麵條要什麼樣的硬度？',
      'カタ麺/普通にしてください - 請給我硬麵/普通硬度的麵',
      'お会計お願いします - 請結帳',
      'カードで払えますか - 可以用卡付款嗎？',
    ]
  },
  '交通': {
    tips: [
      '手機版Suica/Icoca的可以用台灣的信用卡進行除值',
      '特急列車需同時購買乘車券和座位券',
      '公車完全停止後才可以走動及下車',
      '公車上也能儲值交通卡，可以說「チャージをお願いします。」'
    ],
    words: [
      { word: 'チャージ', reading: 'ちゃーじ', meaning: '儲値' },
      { word: '切符', reading: 'きっぷ', meaning: '車票' },
      { word: 'ICカード', reading: 'アイシーカード', meaning: 'IC卡/交通卡' },
      { word: '乗り換え', reading: 'のりかえ', meaning: '轉乘' },
      { word: '改札', reading: 'かいさつ', meaning: '檢票口' },
      { word: 'ホーム', reading: 'ホーム', meaning: '月台' },
      { word: '行き先', reading: 'いきさき', meaning: '目的地' },
      { word: '運賃', reading: 'うんちん', meaning: '車資' },
      { word: '時刻表', reading: 'じこくひょう', meaning: '時刻表' },
    ],
    phrases: [
      'すみません、どこで乗り換えですか - 不好意思，在哪裡轉車？',
      'チャージをお願いします - 請幫我儲值'
    ]
  },
  '醫療看病': {
    tips: [
      '需攜帶國民健康保險證，有國民健康保險，自付額只需30%',
      '預約制診所較多，建議先打電話預約',
      '感冒藥通常會開五天份'
    ],
    words: [
      { word: '薬', reading: 'くすり', meaning: '藥' },
      { word: '診察', reading: 'しんさつ', meaning: '診察' },
      { word: '保険証', reading: 'ほけんしょう', meaning: '保險證' },
      { word: '症状', reading: 'しょうじょう', meaning: '症狀' },
      { word: '熱', reading: 'ねつ', meaning: '發燒' },
      { word: '頭痛', reading: 'ずつう', meaning: '頭痛' },
      { word: '咳', reading: 'せき', meaning: '咳嗽' },
      { word: '受付', reading: 'うけつけ', meaning: '櫃檯' },
      { word: '喉の痛み', reading: 'のどのいたみ', meaning: '喉嚨痛' },
      { word: '鼻水', reading: 'はなみず', meaning: '鼻水' },
      { word: '鼻づまり', reading: 'はなづまり', meaning: '鼻塞' },
      { word: 'くしゃみ', reading: 'くしゃみ', meaning: '打噴嚏' },
      { word: '寒気', reading: 'さむけ', meaning: '發冷' },
      { word: 'だるい', reading: 'だるい', meaning: '全身無力' },
      { word: '吐き気', reading: 'はきけ', meaning: '噁心' },
      { word: '下痢', reading: 'げり', meaning: '拉肚子' },
      { word: '腹痛', reading: 'ふくつう', meaning: '肚子痛' },
      { word: 'めまい', reading: 'めまい', meaning: '頭暈' },
      { word: '痰', reading: 'たん', meaning: '痰' },
      { word: '息苦しい', reading: 'いきぐるしい', meaning: '呼吸困難' },
      { word: '関節痛', reading: 'かんせつつう', meaning: '關節痛' },
      { word: '倦怠感', reading: 'けんたいかん', meaning: '倦怠感' },
      { word: '体温計', reading: 'たいおんけい', meaning: '體溫計' },
      { word: '診断', reading: 'しんだん', meaning: '診斷' },
      { word: '薬局', reading: 'やっきょく', meaning: '藥局' },
      { word: '内科', reading: 'ないか', meaning: '內科' },
      { word: '処方箋', reading: 'しょほうせん', meaning: '處方箋' },
      { word: 'インフルエンザ', reading: 'いんふるえんざ', meaning: '流感' },
      { word: '検温', reading: 'けんおん', meaning: '量體溫' },
      { word: '熱っぽい', reading: 'ねつっぽい', meaning: '覺得發燒' },
      { word: '咽頭炎', reading: 'いんとうえん', meaning: '咽喉炎' },
      { word: '風邪', reading: 'かぜ', meaning: '感冒' },
      { word: '下痢', reading: 'げり', meaning: '拉肚子／腹瀉' }

    ],
    phrases: [
      '具合が悪いです - 我身體不舒服',
      '熱があります - 我發燒了',
      '保険証を持っています - 我有保險證',
      'アレルギーがあります - 我有過敏'
    ]
  },
  '銀行開戶': {
    tips: [
      '需要住民票、在留卡、印章',
      '跨行提款及營業時間外會收手續費，注意使用時間',
      '剛來日本時（例如持留學簽證、就職簽證剛下來的前幾個月），銀行會暫時以「非居住者」的身份開戶。在日本居住滿 6 個月後（即取得「居住者」資格），需要主動去銀行更新資料，讓帳戶改成「居住者」帳戶。'
    ],
    words: [
      { word: '銀行', reading: 'ぎんこう', meaning: '銀行' },
      { word: '口座', reading: 'こうざ', meaning: '帳戶' },
      { word: '開設', reading: 'かいせつ', meaning: '開設' },
      { word: 'キャッシュカード', reading: 'キャッシュカード', meaning: '金融卡' },
      { word: '通帳', reading: 'つうちょう', meaning: '存摺' },
      { word: '印鑑', reading: 'いんかん', meaning: '印章' },
      { word: '暗証番号', reading: 'あんしょうばんごう', meaning: '密碼' },
      { word: '預金', reading: 'よきん', meaning: '存款' },
      { word: '引き出し', reading: 'ひきだし', meaning: '提款' },
      { word: 'ATM', reading: 'エーティーエム', meaning: 'ATM' },
      { word: '振込', reading: 'ふりこみ', meaning: '轉帳' },
      { word: '手数料', reading: 'てすうりょう', meaning: '手續費' },
    ],
    phrases: [
      '口座を開設したいです - 我想要開戶',
      '居住者の手続きをしたいです - 我想辦居住者變更手續'
    ]
  },
  '手機申辦': {
    tips: [
      '需要在留卡、銀行帳戶、信用卡',
      '格安SIM（例如：LINEMO，楽天moblie，POVO）是比較熱門的選擇',
      '注意流量限制，日本不像台灣幾乎每個電信都有網路吃到飽的方案',
    ],
    words: [
      { word: '携帯電話', reading: 'けいたいでんわ', meaning: '手機' },
      { word: 'スマホ', reading: 'スマホ', meaning: '智慧型手機' },
      { word: '契約', reading: 'けいやく', meaning: '契約' },
      { word: 'プラン', reading: 'ぷらん', meaning: '方案' },
      { word: '料金', reading: 'りょうきん', meaning: '費用' },
      { word: '月額', reading: 'げつがく', meaning: '月費' },
      { word: '通話', reading: 'つうわ', meaning: '通話' },
      { word: 'データ', reading: 'でーた', meaning: '數據' },
      { word: '通信速度', reading: 'つうしんそくど', meaning: '網速' },
      { word: 'SIMカード', reading: 'しむかーど', meaning: 'SIM卡' },
      { word: '乗り換え', reading: 'のりかえ', meaning: '轉換門號／攜碼' },
      { word: '解約', reading: 'かいやく', meaning: '解約' },
      { word: '違約金', reading: 'いやくきん', meaning: '違約金' },
    ],
    phrases: [
      'スマホを契約したいです - 我想申辦手機',
      'このプランの料金はいくらですか - 這個方案的費用是多少？',
      '通話し放題ですか - 通話是吃到飽嗎？',
    ]
  }
};

export default function EssentialWords() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const preprocessJapaneseText = (text: string) => {
    // 針對常見的日語發音問題做預處理
    let processedText = text;

    // 拗音處理 - 使用片假名和更強的分隔
    const youonMappings: { [key: string]: string } = {
      'しょ': 'シ　ョ',  // 使用片假名和全角空格
      'しゅ': 'シ　ュ',
      'しゃ': 'シ　ャ',
      'ちょ': 'チ　ョ',
      'ちゅ': 'チ　ュ',
      'ちゃ': 'チ　ャ',
      'にょ': 'ニ　ョ',
      'にゅ': 'ニ　ュ',
      'にゃ': 'ニ　ャ',
      'りょ': 'リ　ョ',
      'りゅ': 'リ　ュ',
      'りゃ': 'リ　ャ',
      'みょ': 'ミ　ョ',
      'みゅ': 'ミ　ュ',
      'みゃ': 'ミ　ャ',
      'びょ': 'ビ　ョ',
      'びゅ': 'ビ　ュ',
      'びゃ': 'ビ　ャ',
      'ぴょ': 'ピ　ョ',
      'ぴゅ': 'ピ　ュ',
      'ぴゃ': 'ピ　ャ',
      'きょ': 'キ　ョ',
      'きゅ': 'キ　ュ',
      'きゃ': 'キ　ャ',
      'ぎょ': 'ギ　ョ',
      'ぎゅ': 'ギ　ュ',
      'ぎゃ': 'ギ　ャ',
      'ひょ': 'ヒ　ョ',
      'ひゅ': 'ヒ　ュ',
      'ひゃ': 'ヒ　ャ'
    };

    // 長音處理 - 讓長音更自然
    const choonMappings: { [key: string]: string } = {
      'とう': 'とお',
      'こう': 'こお',
      'そう': 'そお',
      'ろう': 'ろお',
      'どう': 'どお',
      'ぼう': 'ぼお',
      'もう': 'もお',
      'よう': 'よお',
      'ほう': 'ほお'
    };

    // 應用拗音處理
    Object.keys(youonMappings).forEach(key => {
      const regex = new RegExp(key, 'g');
      processedText = processedText.replace(regex, youonMappings[key]);
    });

    // 應用長音處理
    Object.keys(choonMappings).forEach(key => {
      const regex = new RegExp(key, 'g');
      processedText = processedText.replace(regex, choonMappings[key]);
    });

    return processedText;
  };

  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      // 停止當前播放
      window.speechSynthesis.cancel();

      // 預處理日語文字
      const processedText = preprocessJapaneseText(text);
      console.log('原文:', text, '處理後:', processedText);

      const utterance = new SpeechSynthesisUtterance(processedText);
      utterance.lang = 'ja-JP'; // 設定為日語
      utterance.rate = 0.5; // 非常慢的語速，便於學習
      utterance.volume = 0.8; // 音量
      utterance.pitch = 1.0; // 語調高度 (0.1-2.0)

      // 嘗試找到日語女聲 (優先女聲)
      const voices = window.speechSynthesis.getVoices();

      // 按優先級排序尋找女聲
      const femaleVoice =
        // 1. 尋找日語女聲 (包含 Female 關鍵字)
        voices.find(voice => voice.lang.includes('ja') && voice.name.includes('Female')) ||
        // 2. 尋找 Kyoko (macOS 日語女聲)
        voices.find(voice => voice.lang.includes('ja') && voice.name.includes('Kyoko')) ||
        // 3. 尋找其他常見的日語女聲名稱
        voices.find(voice => voice.lang.includes('ja') && (
          voice.name.includes('女性') ||
          voice.name.includes('Otoya') ||
          voice.name.includes('Sayaka') ||
          voice.name.includes('Haruka')
        )) ||
        // 4. 尋找原生日語語音 (本地安裝)
        voices.find(voice => voice.lang === 'ja-JP' && voice.localService) ||
        // 5. 任何日語語音
        voices.find(voice => voice.lang.includes('ja'));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
        console.log('使用語音:', femaleVoice.name, femaleVoice.lang);
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的瀏覽器不支援語音播放功能');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <header className="py-6 sm:py-8">
          <div className="flex items-start justify-between">
            <div className="text-center flex-1 pr-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-3 leading-tight">
                新手必備單字
              </h1>
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                剛到日本可能遇到的生活情境單字
              </p>
            </div>
            <div className="flex-shrink-0">
              <HamburgerMenu />
            </div>
          </div>
        </header>

        {!selectedCategory ? (
          /* 情境選擇頁面 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
            {Object.entries(essentialWords).map(([category]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="bg-white rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl active:shadow-md transition-all duration-300 hover:-translate-y-1 active:translate-y-0 min-h-[70px] sm:min-h-[80px] flex items-center justify-center touch-manipulation"
              >
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 leading-tight text-center">
                  {category}
                </h3>
              </button>
            ))}
          </div>
        ) : (
          /* 單字詳細頁面 */
          <div className="space-y-6">
            {/* 返回按鈕 */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-4 sm:mb-6 bg-gray-500 hover:bg-gray-200 active:bg-gray-300 px-4 sm:px-6 py-3 sm:py-2 rounded-xl transition-colors flex items-center text-base sm:text-sm font-medium touch-manipulation"
            >
              <span className="mr-2 text-lg sm:text-base">←</span>
              返回選擇情境
            </button>

            {/* 情境標題和提示 */}
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                  {selectedCategory}
                </h2>
              </div>

              {/* 實用提示 */}
              {essentialWords[selectedCategory as keyof typeof essentialWords].tips && (
                <div className="bg-blue-50 rounded-lg p-4 sm:p-5">
                  <h4 className="font-bold text-blue-800 mb-3">
                    實用提示
                  </h4>
                  <div className="space-y-2">
                    {essentialWords[selectedCategory as keyof typeof essentialWords].tips.map((tip, index) => (
                      <p key={index} className="text-blue-700 text-sm sm:text-base leading-relaxed">
                        • {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 單字列表 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6 px-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">常用單字</h3>
                <p className="text-gray-700 text-xs sm:text-sm">
                  點擊喇叭圖示聽讀音
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {essentialWords[selectedCategory as keyof typeof essentialWords].words.map((word, index) => (
                  <div
                    key={index}
                    className="relative border-2 border-gray-200 rounded-lg p-2 sm:p-3 hover:border-blue-300 transition-all duration-200 min-h-[80px] sm:min-h-[90px] flex flex-col justify-center"
                  >
                    <div className="text-center">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-1 leading-tight">
                        {word.word}
                      </h4>
                      <div className="flex items-center justify-center mb-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound(word.reading);
                          }}
                          className="mr-1 hover:scale-110 transition-transform p-1 rounded-full hover:bg-blue-100"
                          title="播放讀音"
                        >
                          <Image
                            src="/icons/volume.svg"
                            alt="播放讀音"
                            width={12}
                            height={12}
                          />
                        </button>
                        <p className="text-blue-600 font-semibold text-sm sm:text-base">
                          {word.reading}
                        </p>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed px-1">
                        {word.meaning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 常用句型 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6 px-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">實用句型</h3>
                <p className="text-gray-700 text-xs sm:text-sm">
                  點擊喇叭圖示聽句子發音
                </p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {essentialWords[selectedCategory as keyof typeof essentialWords].phrases.map((phrase, index) => {
                  // 分離日文和中文部分
                  const parts = phrase.split(' - ');
                  const japanesePart = parts[0]?.trim() || phrase;
                  const chinesePart = parts[1]?.trim();

                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-5 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound(japanesePart);
                          }}
                          className="flex-shrink-0 hover:scale-110 transition-transform p-1 rounded-full hover:bg-blue-100 mt-1"
                          title="播放句子"
                        >
                          <Image
                            src="/icons/volume.svg"
                            alt="播放句子"
                            width={16}
                            height={16}
                          />
                        </button>
                        <div className="flex-1">
                          <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-medium mb-1">
                            {japanesePart}
                          </p>
                          {chinesePart && (
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                              {chinesePart}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 底部導航 */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center mt-8 sm:mt-12">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
            找不到你要學的單字嗎？
          </h3>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 transition-all duration-200 font-semibold text-base sm:text-lg touch-manipulation shadow-lg hover:shadow-xl"
          >
            前往自訂學習內容
          </Link>
        </div>
      </div>
    </div>
  );
}
