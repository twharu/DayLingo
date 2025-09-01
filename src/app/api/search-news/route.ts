import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: '請提供搜尋關鍵字' },
        { status: 400 }
      );
    }

    // 使用 WebSearch 工具搜尋日本新聞
    const searchResults = await searchNews(query);

    return NextResponse.json({
      success: true,
      results: searchResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('News Search API Error:', error);
    return NextResponse.json(
      { 
        error: '搜尋新聞時發生錯誤',
        fallback: '建議查詢 NHK (nhk.or.jp)、朝日新聞 (asahi.com)、毎日新聞 (mainichi.jp) 等日本新聞網站'
      },
      { status: 500 }
    );
  }
}

async function searchNews(query: string) {
  try {
    console.log('搜尋查詢:', query);
    
    // 建構日語搜尋關鍵字
    const japaneseQuery = translateToJapaneseKeywords(query);
    console.log('日語搜尋關鍵字:', japaneseQuery);
    
    // 由於我無法在 API 路由中直接使用 WebSearch 工具，
    // 這裡返回一個指引用戶自行搜尋的結果
    const guideResults = [
      {
        title: `${japaneseQuery} に関連するニュースを検索`,
        url: `https://www3.nhk.or.jp/news/word/search.html?word=${encodeURIComponent(japaneseQuery)}`,
        snippet: `NHK ニュースで「${japaneseQuery}」に関連する最新ニュースを検索できます。`,
        source: 'NHK 검색 가이드'
      },
      {
        title: `Yahoo!ニュースで${japaneseQuery}を検索`,
        url: `https://news.yahoo.co.jp/search?p=${encodeURIComponent(japaneseQuery)}`,
        snippet: `Yahoo!ニュースで「${japaneseQuery}」の最新ニュースを確認してください。`,
        source: 'Yahoo!ニュース 검색 가이드'
      }
    ];
    
    return guideResults;
    
  } catch (error) {
    console.error('Search execution error:', error);
    throw error;
  }
}

function translateToJapaneseKeywords(chineseQuery: string) {
  // 簡單的中日對照關鍵字翻譯
  const translations: { [key: string]: string } = {
    '便利商店': 'コンビニ',
    '購物': '買い物',
    '餐廳': 'レストラン',
    '交通': '交通',
    '學校': '学校',
    '醫院': '病院',
    '銀行': '銀行',
    '郵局': '郵便局',
    '工作': '仕事',
    '社交': '社交',
    '緊急': '緊急',
    '日用品': '日用品',
    '洗髮精': 'シャンプー',
    '牙膏': '歯磨き粉'
  };
  
  let japaneseQuery = chineseQuery;
  
  for (const [chinese, japanese] of Object.entries(translations)) {
    japaneseQuery = japaneseQuery.replace(new RegExp(chinese, 'g'), japanese);
  }
  
  return japaneseQuery || 'ニュース';
}