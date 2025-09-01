'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';

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
    '日常生活',
    '購物消費',
    '餐廳用餐',
    '交通出行',
    '學校生活',
    '醫療健康',
    '銀行郵局',
    '工作相關',
    '社交活動',
    '緊急情況'
  ];

  useEffect(() => {
    loadSavedWords();
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
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                單字庫
              </h1>
              <p className="text-gray-600">
                已收藏 {savedWords.length} 個單字
              </p>
            </div>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              回到首頁
            </Link>
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
                        <h3 className="text-xl font-bold text-gray-800">
                          {word.word} - {word.meaning}
                        </h3>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-lg text-blue-600 font-medium flex items-center">
                          <Image 
                            src="/icons/volume.svg" 
                            alt="讀音" 
                            width={20} 
                            height={20} 
                            className="mr-2"
                          />
                          {word.reading}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <p className="text-gray-800 mb-1">
                          <span className="font-medium">例句：</span>
                          <span 
                            className="ruby-content"
                            dangerouslySetInnerHTML={{ __html: word.example }}
                            style={{ fontSize: '16px', lineHeight: '1.8' }}
                          />
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">翻譯：</span>{word.exampleTranslation}
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