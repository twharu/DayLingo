'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  // 取得今天的日期並格式化為 YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [parsedWords, setParsedWords] = useState<any[]>([]);
  const [savingWords, setSavingWords] = useState<Set<number>>(new Set());
  const [savedWords, setSavedWords] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 從 localStorage 載入保存的內容
    const savedContent = localStorage.getItem('generatedContent');
    const savedFormData = localStorage.getItem('formData');
    
    if (savedContent) {
      try {
        const parsedContent = JSON.parse(savedContent);
        setContent(parsedContent);
        parseWords(parsedContent.content);
      } catch (error) {
        console.error('載入保存的內容失敗:', error);
      }
    }
    
    if (savedFormData) {
      try {
        const parsedFormData = JSON.parse(savedFormData);
        setSelectedDate(parsedFormData.selectedDate || getTodayDate());
        setSelectedCategory(parsedFormData.selectedCategory || '');
        setTaskName(parsedFormData.taskName || '');
        setTaskDescription(parsedFormData.taskDescription || '');
      } catch (error) {
        console.error('載入保存的表單資料失敗:', error);
      }
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedCategory || !taskName.trim() || !taskDescription.trim()) {
      alert('請填寫所有必填欄位');
      return;
    }

    const fullTask = `
日期: ${selectedDate}
分類: ${selectedCategory}
任務名稱: ${taskName}
詳細描述: ${taskDescription}
    `.trim();

    setLoading(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: fullTask }),
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data);
        parseWords(data.content);
        
        // 儲存生成的內容到 localStorage
        localStorage.setItem('generatedContent', JSON.stringify(data));
        
        // 儲存表單資料到 localStorage
        const formData = {
          selectedDate,
          selectedCategory,
          taskName,
          taskDescription
        };
        localStorage.setItem('formData', JSON.stringify(formData));
        
        // 等待一下讓內容渲染完成，然後滾動到內容區域
        setTimeout(() => {
          contentRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        alert('生成內容時發生錯誤');
      }
    } catch (error) {
      alert('發生錯誤，請稍後再試');
    }
    setLoading(false);
  };

  const parseWords = (content: string) => {
    const words = [];
    const lines = content.split('\n');
    let inWordsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('重要詞組') || line.includes('## 重要詞組')) {
        inWordsSection = true;
        continue;
      }
      
      if (line.includes('## 日常對話')) {
        inWordsSection = false;
        continue;
      }
      
      if (inWordsSection && line.match(/^\d+\./)) {
        // 移除數字編號
        const cleanLine = line.replace(/^\d+\.\s*/, '');
        const wordMatch = cleanLine.match(/^(.+?)\s*-\s*(.+)$/);
        
        if (wordMatch) {
          const [, wordWithRuby, meaning] = wordMatch;
          
          // 提取ruby標記中的單字和讀音，並構建完整讀音
          const rubyPattern = /<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/g;
          let word = wordWithRuby;
          let reading = '';
          
          // 構建完整的讀音，包含平假名和漢字讀音
          let tempText = wordWithRuby;
          let match;
          
          // 將所有 ruby 標記替換為對應的讀音
          while ((match = rubyPattern.exec(wordWithRuby)) !== null) {
            const kanjiPart = match[1];
            const readingPart = match[2];
            tempText = tempText.replace(match[0], readingPart);
          }
          
          // 重置 regex 的 lastIndex
          rubyPattern.lastIndex = 0;
          
          reading = tempText;
          
          // 移除ruby標記，只保留漢字和平假名
          word = wordWithRuby.replace(/<ruby>([^<]+)<rt>[^<]+<\/rt><\/ruby>/g, '$1');
          // 不要強制添加する，保持原始形式
          
          // 找例句
          let example = '';
          let exampleTranslation = '';
          if (i + 1 < lines.length && lines[i + 1].includes('例句：')) {
            const exampleLine = lines[i + 1];
            const exampleMatch = exampleLine.match(/例句：(.+?)\s*-\s*(.+)$/);
            if (exampleMatch) {
              example = exampleMatch[1].trim();
              exampleTranslation = exampleMatch[2].trim();
            }
          }
          
          if (word && reading && meaning) {
            words.push({
              word: word.trim(),
              reading: reading.trim(),
              meaning: meaning.trim(),
              example,
              exampleTranslation
            });
          }
        }
      }
    }
    
    setParsedWords(words);
  };

  const filterContent = (content: string) => {
    // 移除重要詞組部分，只保留日常對話和相關新聞
    const lines = content.split('\n');
    const filteredLines = [];
    let skipSection = false;
    
    for (const line of lines) {
      if (line.includes('## 重要詞組')) {
        skipSection = true;
        continue;
      }
      
      if (line.includes('## 日常對話')) {
        skipSection = false;
      }
      
      if (!skipSection) {
        filteredLines.push(line);
      }
    }
    
    return filteredLines.join('\n');
  };

  const saveWord = async (wordIndex: number) => {
    const word = parsedWords[wordIndex];
    if (!word) return;

    setSavingWords(prev => new Set(prev).add(wordIndex));
    
    try {
      await addDoc(collection(db, 'savedWords'), {
        word: word.word,
        reading: word.reading,
        meaning: word.meaning,
        example: word.example,
        exampleTranslation: word.exampleTranslation,
        category: selectedCategory,
        savedAt: new Date().toISOString()
      });
      
      setSavedWords(prev => new Set(prev).add(wordIndex));
    } catch (error) {
      console.error('儲存單字失敗:', error);
      alert('儲存失敗，請稍後再試');
    }
    
    setSavingWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(wordIndex);
      return newSet;
    });
  };

  const clearContent = () => {
    setContent(null);
    setParsedWords([]);
    setSavedWords(new Set());
    setSelectedDate(getTodayDate());
    setSelectedCategory('');
    setTaskName('');
    setTaskDescription('');
    localStorage.removeItem('generatedContent');
    localStorage.removeItem('formData');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      
      <div className="max-w-4xl mx-auto">
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                日本留學生活日語學習
              </h1>
              <p className="text-gray-600">
                記錄你的日常任務，AI會生成相關的日語學習內容
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/essential-words"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                新手必備
              </Link>
              <Link 
                href="/vocabulary"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                單字庫
              </Link>
              {content && (
                <button
                  onClick={clearContent}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  重新開始
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. 選擇日期 */}
            <div>
              <label htmlFor="date" className="block text-lg font-medium text-gray-700 mb-3">
                1. 選擇日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
              />
            </div>

            {/* 2. 任務分類標籤 */}
            <div>
              <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-3">
                2. 任務分類 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
              >
                <option value="">請選擇分類...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. 任務名稱 */}
            <div>
              <label htmlFor="taskName" className="block text-lg font-medium text-gray-700 mb-3">
                3. 任務名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="taskName"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="例如：便利商店購買日用品、餐廳點餐、問路等..."
                required
              />
            </div>

            {/* 4. 任務詳細描述 */}
            <div>
              <label htmlFor="taskDescription" className="block text-lg font-medium text-gray-700 mb-3">
                4. 任務詳細描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                rows={4}
                placeholder="請詳細描述這個任務的情境、目的、可能遇到的狀況等..."
                required
              />
            </div>

            {/* 5. 送出按鈕 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !selectedDate || !selectedCategory || !taskName.trim() || !taskDescription.trim()}
                className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
              >
                {loading ? 'AI 生成學習內容中...' : '生成日語學習內容'}
              </button>
            </div>
          </form>
        </div>

        {content && (
          <div ref={contentRef} className="space-y-6">
            {/* 單字收藏區域 */}
            {parsedWords.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">重要詞組 - 點擊收藏</h2>
                <div className="grid gap-4">
                  {parsedWords.map((word, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-xl font-bold text-gray-800 mr-4">
                              {word.word} - {word.meaning}
                            </h3>
                          </div>
                          <p className="text-blue-600 font-medium mb-2 flex items-center">
                            <Image 
                              src="/icons/volume.svg" 
                              alt="讀音" 
                              width={18} 
                              height={18} 
                              className="mr-2"
                            />
                            {word.reading}
                          </p>
                          {word.example && (
                            <div className="bg-gray-50 p-3 rounded">
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
                          )}
                        </div>
                        <button
                          onClick={() => saveWord(index)}
                          disabled={savingWords.has(index) || savedWords.has(index)}
                          className={`ml-4 px-4 py-2 rounded-lg transition-colors ${
                            savedWords.has(index) 
                              ? 'bg-green-600 text-white cursor-default' 
                              : savingWords.has(index)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {savingWords.has(index) ? '儲存中...' : savedWords.has(index) ? '已收藏' : '收藏'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 完整內容顯示 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">完整學習內容</h2>
              <div className="prose prose-lg max-w-none">
                <div 
                  className="whitespace-pre-wrap text-gray-700 leading-relaxed ruby-content"
                  dangerouslySetInnerHTML={{ __html: filterContent(content.content) }}
                  style={{
                    fontSize: '18px',
                    lineHeight: '2'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-lg">AI 正在為您生成個人化的日語學習內容...</p>
          </div>
        )}
      </div>
    </div>
  );
}
