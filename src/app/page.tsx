'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SurveyModal from '@/lib/components/SurveyModal';
import HamburgerMenu from '@/lib/components/HamburgerMenu';

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
  const [showSurvey, setShowSurvey] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

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
    
    // 預載語音庫
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    
    // 檢查是否需要顯示問卷
    const surveyCompleted = localStorage.getItem('surveyCompleted');
    if (!surveyCompleted) {
      // 延遲1秒後顯示問卷彈窗
      const timer = setTimeout(() => {
        setShowSurvey(true);
      }, 1000);
      return () => clearTimeout(timer);
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

  const clearContent = () => {
    setContent(null);
    setParsedWords([]);
    setSavedWords(new Set());
    setSelectedWordIndex(null);
    setSelectedDate(getTodayDate());
    setSelectedCategory('');
    setTaskName('');
    setTaskDescription('');
    localStorage.removeItem('generatedContent');
    localStorage.removeItem('formData');
  };

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
                您的寶貴意見將幫助我們打造更符合留學生需求的日語學習工具。<br />
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
            <HamburgerMenu 
              currentPath="/"
              hasContent={!!content}
              onClearContent={clearContent}
            />
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {parsedWords.map((word, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-300 transition-colors cursor-pointer aspect-square flex items-center justify-center"
                      onClick={() => setSelectedWordIndex(index)}
                    >
                      <div className="text-center w-full">
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">
                          {word.word}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">{word.meaning}</p>
                        <p className="text-blue-600 font-medium mb-2 md:mb-3 flex items-center justify-center text-sm">
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
                              width={14} 
                              height={14}
                            />
                          </button>
                          <span className="text-xs md:text-sm">{word.reading}</span>
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveWord(index);
                          }}
                          disabled={savingWords.has(index) || savedWords.has(index)}
                          className={`w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
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

            {/* 例句彈窗 */}
            {selectedWordIndex !== null && parsedWords[selectedWordIndex] && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedWordIndex(null)}>
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {parsedWords[selectedWordIndex].word}
                      </h3>
                      <p className="text-lg text-gray-600 mb-3">{parsedWords[selectedWordIndex].meaning}</p>
                      <p className="text-blue-600 font-medium flex items-center">
                        <button
                          onClick={() => playSound(parsedWords[selectedWordIndex].reading)}
                          className="mr-2 hover:scale-110 transition-transform p-1 rounded-full hover:bg-blue-100"
                          title="播放讀音"
                        >
                          <Image 
                            src="/icons/volume.svg" 
                            alt="播放讀音" 
                            width={18} 
                            height={18}
                          />
                        </button>
                        {parsedWords[selectedWordIndex].reading}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedWordIndex(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  
                  {parsedWords[selectedWordIndex].example && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">例句：</h4>
                        <button
                          onClick={() => {
                            // 正確處理 ruby 標籤：提取漢字部分，移除讀音標注
                            let cleanExample = parsedWords[selectedWordIndex].example;
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
                          播放
                        </button>
                      </div>
                      <p className="text-gray-800 mb-3 text-lg leading-relaxed">
                        <span 
                          className="ruby-content"
                          dangerouslySetInnerHTML={{ __html: parsedWords[selectedWordIndex].example }}
                          style={{ fontSize: '18px', lineHeight: '2' }}
                        />
                      </p>
                      <h4 className="font-medium text-gray-800 mb-2">翻譯：</h4>
                      <p className="text-gray-600 text-lg">{parsedWords[selectedWordIndex].exampleTranslation}</p>
                    </div>
                  )}
                  
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        saveWord(selectedWordIndex);
                        setSelectedWordIndex(null);
                      }}
                      disabled={savingWords.has(selectedWordIndex) || savedWords.has(selectedWordIndex)}
                      className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                        savedWords.has(selectedWordIndex) 
                          ? 'bg-green-600 text-white cursor-default' 
                          : savingWords.has(selectedWordIndex)
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {savingWords.has(selectedWordIndex) ? '儲存中...' : savedWords.has(selectedWordIndex) ? '已收藏' : '收藏這個詞組'}
                    </button>
                    <button
                      onClick={() => setSelectedWordIndex(null)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      關閉
                    </button>
                  </div>
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
