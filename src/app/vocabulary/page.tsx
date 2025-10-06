'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import HamburgerMenu from '@/lib/components/HamburgerMenu';

interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  category?: string;
  savedAt: string;
}

export default function VocabularyPage() {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    '日常',
    '購物',
    '學校',
    '文件申辦',
    '工作'
  ];

  useEffect(() => {
    loadSavedWords();
    
    // 預載語音庫
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const loadSavedWords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'savedWords'));
      const words: SavedWord[] = [];
      querySnapshot.forEach((doc) => {
        words.push({ id: doc.id, ...doc.data() } as SavedWord);
      });
      // 按儲存時間排序（最新的在前）
      words.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setSavedWords(words);
    } catch (error) {
      console.error('載入單字失敗:', error);
    }
    setLoading(false);
  };

  const getFilteredWords = () => {
    if (selectedCategory === 'all') {
      return savedWords;
    }
    return savedWords.filter(word => word.category === selectedCategory);
  };

  const getWordsByCategory = () => {
    const wordsByCategory: { [key: string]: SavedWord[] } = {};
    
    categories.forEach(category => {
      wordsByCategory[category] = savedWords.filter(word => word.category === category);
    });
    
    // 添加未分類的單字
    const uncategorizedWords = savedWords.filter(word => !word.category || !categories.includes(word.category));
    if (uncategorizedWords.length > 0) {
      wordsByCategory['未分類'] = uncategorizedWords;
    }
    
    return wordsByCategory;
  };

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

  const deleteWord = async (id: string) => {
    if (confirm('確定要刪除這個單字嗎？')) {
      try {
        await deleteDoc(doc(db, 'savedWords', id));
        setSavedWords(savedWords.filter(word => word.id !== id));
      } catch (error) {
        console.error('刪除單字失敗:', error);
        alert('刪除失敗，請稍後再試');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入單字庫中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                單字庫
              </h1>
              <p className="text-gray-600">
                已收藏 {savedWords.length} 個單字
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                回到首頁
              </Link>
              <HamburgerMenu currentPath="/vocabulary" />
            </div>
          </div>
        </header>

        {/* 分類選擇器 */}
        {savedWords.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">按分類瀏覽</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部 ({savedWords.length})
              </button>
              {categories.map(category => {
                const count = savedWords.filter(word => word.category === category).length;
                if (count === 0) return null;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
              {savedWords.filter(word => !word.category || !categories.includes(word.category)).length > 0 && (
                <button
                  onClick={() => setSelectedCategory('uncategorized')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'uncategorized'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  未分類 ({savedWords.filter(word => !word.category || !categories.includes(word.category)).length})
                </button>
              )}
            </div>
          </div>
        )}

        {savedWords.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">單字庫是空的</h2>
            <p className="text-gray-600 mb-6">
              開始學習並收藏你喜歡的單字吧！
            </p>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              開始學習
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const filteredWords = selectedCategory === 'all' 
                ? savedWords 
                : selectedCategory === 'uncategorized'
                  ? savedWords.filter(word => !word.category || !categories.includes(word.category))
                  : savedWords.filter(word => word.category === selectedCategory);
              
              return filteredWords.map((word, index) => (
                <div key={word.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mr-3">
                          #{index + 1}
                        </span>
                        {word.category && (
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mr-3">
                            {word.category}
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {word.word.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1').replace(/<[^>]*>/g, '')}
                        </h3>
                        <p className="text-gray-600">{word.meaning}</p>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-lg text-blue-600 font-medium flex items-center">
                          <button
                            onClick={() => playSound(word.reading)}
                            className="mr-2 hover:scale-110 transition-transform p-1 rounded-full hover:bg-blue-100"
                            title="播放讀音"
                          >
                            <Image 
                              src="/icons/volume.svg" 
                              alt="播放讀音" 
                              width={20} 
                              height={20}
                            />
                          </button>
                          {word.reading}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-gray-800">例句：</span>
                          <button
                            onClick={() => {
                              // 正確處理 ruby 標籤：提取漢字部分，移除讀音標注
                              let cleanExample = word.example;
                              // 將 <ruby>漢字<rt>讀音</rt></ruby> 替換為 漢字
                              cleanExample = cleanExample.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1');
                              // 移除其他 HTML 標籤
                              cleanExample = cleanExample.replace(/<[^>]*>/g, '');
                              console.log('播放例句:', cleanExample);
                              playSound(cleanExample);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors text-sm"
                            title="播放例句"
                          >
                            <Image 
                              src="/icons/volume.svg" 
                              alt="播放例句" 
                              width={16} 
                              height={16}
                            />
                          </button>
                        </div>
                        <p className="text-gray-800 mb-3">
                          <span 
                            className="ruby-content"
                            dangerouslySetInnerHTML={{ __html: word.example }}
                            style={{ fontSize: '16px', lineHeight: '1.8' }}
                          />
                        </p>
                        <p className="text-gray-600">
                          {word.exampleTranslation}
                        </p>
                      </div>

                      <p className="text-sm text-gray-500">
                        收藏時間：{new Date(word.savedAt).toLocaleString('zh-TW')}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteWord(word.id)}
                      className="ml-4 text-red-500 hover:text-red-700 transition-colors p-2 shadow-md hover:shadow-lg rounded-lg"
                      title="刪除單字"
                    >
                      <Image 
                        src="/icons/delete.svg" 
                        alt="刪除" 
                        width={20} 
                        height={20}
                      />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}