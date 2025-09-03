'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SurveyModal from '@/lib/components/SurveyModal';

// 預設情境單字資料
const essentialWords = {
  '區役所/市役所手續': {
    icon: '📋',
    tips: [
      '⚠️ 到達日本後14天內必須辦理轉入手續',
      '📝 準備文件：在留卡、護照、租房契約書',
      '🕐 營業時間通常是平日 8:30-17:15，中午可能休息',
      '💰 多數手續免費，但影印費用需自付（一張10日圓）'
    ],
    words: [
      { word: '住民票', reading: 'じゅうみんひょう', meaning: '住民票' },
      { word: '転入届', reading: 'てんにゅうとどけ', meaning: '遷入申請書' },
      { word: '転出届', reading: 'てんしゅつとどけ', meaning: '遷出申請書' },
      { word: '印鑑登録', reading: 'いんかんとうろく', meaning: '印章登記' },
      { word: '身分証明書', reading: 'みぶんしょうめいしょ', meaning: '身分證明文件' },
      { word: '在留カード', reading: 'ざいりゅうカード', meaning: '在留卡' },
      { word: '国民健康保険', reading: 'こくみんけんこうほけん', meaning: '國民健康保險' },
      { word: '年金', reading: 'ねんきん', meaning: '年金' },
      { word: '手続き', reading: 'てつづき', meaning: '手續、申請' },
      { word: '申請書', reading: 'しんせいしょ', meaning: '申請書' },
      { word: '窓口', reading: 'まどぐち', meaning: '櫃檯' },
      { word: '受付', reading: 'うけつけ', meaning: '受理、接待' },
    ],
    phrases: [
      '住民票をお願いします - 請給我住民票',
      '転入届を出したいです - 我想要提出遷入申請',
      'どこで手続きできますか - 在哪裡可以辦理手續？',
    ]
  },
  '租房找房': {
    icon: '🏠',
    tips: [
      '💰 初期費用通常是房租的3-6倍（敷金+禮金+仲介費+首月房租）',
      '📋 需要保證人或保證公司，外國人多使用保證公司',
      '🔍 可利用 Suumo、at home 等網站找房',
      '⚠️ 注意管理費、停車費等額外費用'
    ],
    words: [
      { word: '賃貸', reading: 'ちんたい', meaning: '租賃' },
      { word: '敷金', reading: 'しききん', meaning: '押金' },
      { word: '礼金', reading: 'れいきん', meaning: '禮金' },
      { word: '仲介手数料', reading: 'ちゅうかいてすうりょう', meaning: '仲介手續費' },
      { word: '家賃', reading: 'やちん', meaning: '房租' },
      { word: '管理費', reading: 'かんりひ', meaning: '管理費' },
      { word: '契約書', reading: 'けいやくしょ', meaning: '契約書' },
      { word: '保証人', reading: 'ほしょうにん', meaning: '保證人' },
      { word: '不動産', reading: 'ふどうさん', meaning: '房地產' },
      { word: 'ワンルーム', reading: 'ワンルーム', meaning: '套房' },
      { word: '駅近', reading: 'えきちか', meaning: '靠近車站' },
      { word: '内見', reading: 'ないけん', meaning: '看房' },
    ],
    phrases: [
      '部屋を探しています - 我在找房子',
      '内見をお願いします - 請讓我看房',
      '家賃はいくらですか - 房租多少錢？',
    ]
  },
  '便利商店購物': {
    icon: '🏪',
    tips: [
      '🍱 便當可免費加熱，說「温めてください」',
      '💳 多數支援信用卡和電子支付',
      '🎫 可代收包裹、繳費、購買車票等',
      '🛍️ 塑膠袋需付費（3-5日圓）'
    ],
    words: [
      { word: 'コンビニ', reading: 'コンビニ', meaning: '便利商店' },
      { word: '弁当', reading: 'べんとう', meaning: '便當' },
      { word: 'おにぎり', reading: 'おにぎり', meaning: '飯糰' },
      { word: 'パン', reading: 'パン', meaning: '麵包' },
      { word: '飲み物', reading: 'のみもの', meaning: '飲料' },
      { word: 'お菓子', reading: 'おかし', meaning: '零食' },
      { word: 'レジ', reading: 'レジ', meaning: '收銀台' },
      { word: 'レシート', reading: 'レシート', meaning: '收據' },
      { word: '袋', reading: 'ふくろ', meaning: '袋子' },
      { word: '温める', reading: 'あたためる', meaning: '加熱' },
      { word: 'お箸', reading: 'おはし', meaning: '筷子' },
      { word: 'スプーン', reading: 'スプーン', meaning: '湯匙' },
    ],
    phrases: [
      '温めてください - 請幫我加熱',
      '袋はいりません - 不用袋子',
      'お箸をください - 請給我筷子',
    ]
  },
  '餐廳點餐': {
    icon: '🍜',
    tips: [
      '🍽️ 很多餐廳有圖片菜單，指著點也OK',
      '💧 冰水通常免費，可說「お水ください」',
      '🚫 一般不需要給小費',
      '💳 結帳時到櫃台付款，不在座位上付'
    ],
    words: [
      { word: 'メニュー', reading: 'メニュー', meaning: '菜單' },
      { word: '注文', reading: 'ちゅうもん', meaning: '點餐' },
      { word: '定食', reading: 'ていしょく', meaning: '定食' },
      { word: 'ラーメン', reading: 'ラーメン', meaning: '拉麵' },
      { word: '寿司', reading: 'すし', meaning: '壽司' },
      { word: '天ぷら', reading: 'てんぷら', meaning: '天婦羅' },
      { word: 'ご飯', reading: 'ごはん', meaning: '米飯' },
      { word: '味噌汁', reading: 'みそしる', meaning: '味噌湯' },
      { word: 'お水', reading: 'おみず', meaning: '水' },
      { word: 'お会計', reading: 'おかいけい', meaning: '結帳' },
      { word: '現金', reading: 'げんきん', meaning: '現金' },
      { word: 'クレジットカード', reading: 'クレジットカード', meaning: '信用卡' },
    ],
    phrases: [
      'これをお願いします - 請給我這個',
      'お会計お願いします - 請結帳',
      'カードで払えますか - 可以用卡付款嗎？',
    ]
  },
  '交通出行': {
    icon: '🚇',
    tips: [
      '💳 買IC卡（Suica/Pasmo）最方便，可搭所有交通工具',
      '📱 推薦使用 Google Maps 或 Hyperdia 查詢路線',
      '🚄 注意普通車、急行、特急的差別和費用',
      '⏰ 末班車通常在午夜前，計畫好回程時間'
    ],
    words: [
      { word: '電車', reading: 'でんしゃ', meaning: '電車' },
      { word: '地下鉄', reading: 'ちかてつ', meaning: '地下鐵' },
      { word: 'バス', reading: 'バス', meaning: '公車' },
      { word: 'タクシー', reading: 'タクシー', meaning: '計程車' },
      { word: '切符', reading: 'きっぷ', meaning: '車票' },
      { word: 'ICカード', reading: 'アイシーカード', meaning: 'IC卡' },
      { word: '乗り換え', reading: 'のりかえ', meaning: '轉乘' },
      { word: '改札', reading: 'かいさつ', meaning: '檢票口' },
      { word: 'ホーム', reading: 'ホーム', meaning: '月台' },
      { word: '行き先', reading: 'いきさき', meaning: '目的地' },
      { word: '運賃', reading: 'うんちん', meaning: '車資' },
      { word: '時刻表', reading: 'じこくひょう', meaning: '時刻表' },
    ],
    phrases: [
      'すみません、どこで乗り換えですか - 不好意思，在哪裡轉車？',
      '〇〇駅はどこですか - 〇〇車站在哪裡？',
      'いくらですか - 多少錢？',
    ]
  },
  '醫療看病': {
    icon: '🏥',
    tips: [
      '🏥 有國民健康保險，自付額只需30%',
      '📞 預約制醫院較多，建議先打電話',
      '💊 處方藥需到藥局拿，不是在醫院領',
      '🌙 緊急情況可撥打119叫救護車'
    ],
    words: [
      { word: '病院', reading: 'びょういん', meaning: '醫院' },
      { word: '医者', reading: 'いしゃ', meaning: '醫生' },
      { word: '薬局', reading: 'やっきょく', meaning: '藥局' },
      { word: '薬', reading: 'くすり', meaning: '藥' },
      { word: '診察', reading: 'しんさつ', meaning: '診察' },
      { word: '予約', reading: 'よやく', meaning: '預約' },
      { word: '保険証', reading: 'ほけんしょう', meaning: '保險證' },
      { word: '症状', reading: 'しょうじょう', meaning: '症狀' },
      { word: '熱', reading: 'ねつ', meaning: '發燒' },
      { word: '頭痛', reading: 'ずつう', meaning: '頭痛' },
      { word: '風邪', reading: 'かぜ', meaning: '感冒' },
      { word: '受付', reading: 'うけつけ', meaning: '櫃檯' },
    ],
    phrases: [
      '具合が悪いです - 我身體不舒服',
      '予約をお願いします - 請幫我預約',
      '保険証を持っています - 我有保險證',
    ]
  },
  '銀行開戶': {
    icon: '🏦',
    tips: [
      '📝 需要住民票、在留卡、印章（或簽名）',
      '🏛️ 推薦選擇住家或學校附近的銀行',
      '📱 多數銀行有手機APP可查餘額、轉帳',
      '💰 跨行提款會收手續費，注意使用時間'
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
      'ATMはどこですか - ATM在哪裡？',
      '手数料はいくらですか - 手續費多少錢？',
    ]
  },
  '手機申辦': {
    icon: '📱',
    tips: [
      '📋 需要在留卡、銀行帳戶、信用卡或現金卡',
      '💰 格安SIM（MVNO）比三大電信便宜很多',
      '🌐 注意流量限制，無限流量方案較貴',
      '📱 可考慮先用預付卡測試訊號品質'
    ],
    words: [
      { word: '携帯電話', reading: 'けいたいでんわ', meaning: '手機' },
      { word: 'スマホ', reading: 'スマホ', meaning: '智慧型手機' },
      { word: '契約', reading: 'けいやく', meaning: '契約' },
      { word: 'プラン', reading: 'プラン', meaning: '方案' },
      { word: '料金', reading: 'りょうきん', meaning: '費用' },
      { word: '月額', reading: 'げつがく', meaning: '月費' },
      { word: '通話', reading: 'つうわ', meaning: '通話' },
      { word: 'データ', reading: 'データ', meaning: '數據' },
      { word: 'Wi-Fi', reading: 'ワイファイ', meaning: 'Wi-Fi' },
      { word: 'SIMカード', reading: 'シムカード', meaning: 'SIM卡' },
      { word: '機種変更', reading: 'きしゅへんこう', meaning: '換機' },
      { word: '解約', reading: 'かいやく', meaning: '解約' },
    ],
    phrases: [
      'プリペイドはありますか - 有預付卡嗎？',
      '一番安いプランは何ですか - 最便宜的方案是什麼？',
      '契約したいです - 我想要申辦',
    ]
  }
};

export default function EssentialWords() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // 檢查是否需要顯示問卷
  useEffect(() => {
    const surveyCompleted = localStorage.getItem('surveyCompleted');
    if (!surveyCompleted) {
      // 延遲1秒後顯示問卷彈窗
      const timer = setTimeout(() => {
        setShowSurvey(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <SurveyModal 
        isOpen={showSurvey}
        onComplete={() => {
          setShowSurvey(false);
          setShowThankYou(true);
          // 3秒後自動關閉感謝信息
          setTimeout(() => {
            setShowThankYou(false);
          }, 3000);
        }}
        onClose={() => {
          setShowSurvey(false);
        }}
      />
      
      {/* 感謝信息彈窗 */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">感謝您的參與！</h3>
              <p className="text-gray-600 leading-relaxed">
                您的寶貴意見將幫助我們打造更符合留學生需求的日語學習工具。<br/>
                祝您在日本的學習生活順利愉快！
              </p>
            </div>
            <button
              onClick={() => setShowThankYou(false)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              開始學習日語
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        <header className="py-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            新手必備單字集
          </h1>
          <p className="text-gray-600 text-lg">
            剛到日本最常遇到的生活情境單字
          </p>
        </header>

        {!selectedCategory ? (
          /* 情境選擇頁面 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Object.entries(essentialWords).map(([category, data]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="text-4xl mb-4">{data.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{category}</h3>
                <p className="text-gray-600">
                  {data.words.length} 個常用單字
                </p>
              </button>
            ))}
          </div>
        ) : (
          /* 單字詳細頁面 */
          <div className="space-y-6">
            {/* 返回按鈕 */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-6 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <span className="mr-2">←</span>
              返回選擇情境
            </button>

            {/* 情境標題 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <span className="text-5xl mr-4">
                  {essentialWords[selectedCategory].icon}
                </span>
                <h2 className="text-3xl font-bold text-gray-800">
                  {selectedCategory}
                </h2>
              </div>
            </div>

            {/* 單字列表 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">常用單字</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {essentialWords[selectedCategory].words.map((word, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">
                        {word.word}
                      </h4>
                      <p className="text-blue-600 font-medium mb-1">
                        {word.reading}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {word.meaning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 常用句型 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">實用句型</h3>
              <div className="space-y-4">
                {essentialWords[selectedCategory].phrases.map((phrase, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-lg text-gray-800">
                      {phrase}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 底部導航 */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            找不到你要學的內容嗎？
          </h3>
          <p className="text-gray-600 mb-6">
            前往自訂學習內容，AI會為你生成專屬的日語學習材料
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            前往自訂學習內容
          </Link>
        </div>
      </div>
    </div>
  );
}