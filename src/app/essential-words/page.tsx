'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      { word: '在留カード', reading: 'ざいりゅうカード', meaning: '在留卡' },
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
      '租屋後，水電瓦斯需自己打電話或線上申請開通',
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
      { word: 'ワンルーム', reading: 'ワンルーム', meaning: '套房' },
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
  '便利商店購物': {
    tips: [
      '塑膠袋需付費（3-5日圓）',
      '可以繳水電瓦斯費、購買車票等',
      '可以影印、列印住民票'

    ],
    words: [
      { word: 'おにぎり', reading: 'おにぎり', meaning: '飯糰' },
      { word: 'レジ', reading: 'れじ', meaning: '收銀台' },
      { word: 'レシート', reading: 'れしーと', meaning: '收據' },
      { word: '袋', reading: 'ふくろ', meaning: '袋子' },
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
      'お箸をください - 請給我筷子',
      'クレジットカードでお願いします - 我要用信用卡付款',
      'Suicaで払います - 用Suica支付',
      '住民票を印刷したいです - 我想列印住民票'
    ]
  },
  '餐廳點餐': {
    tips: [
      '日本餐廳通常都是提供冰水，冰水的日文是「おひや」ㄝ，可以說「おひやください」',
    ],
    words: [
      { word: 'メニュー', reading: 'メニュー', meaning: '菜單' },
      { word: '注文', reading: 'ちゅうもん', meaning: '點餐' },
      { word: '定食', reading: 'ていしょく', meaning: '定食' },
      { word: '天ぷら', reading: 'てんぷら', meaning: '天婦羅' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                新手必備單字集
              </h1>
              <p className="text-gray-600 text-lg">
                剛到日本最常遇到的生活情境單字
              </p>
            </div>
            <HamburgerMenu currentPath="/essential-words" />
          </div>
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