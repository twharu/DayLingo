'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import SurveyModal from '@/lib/components/SurveyModal';
import PostUsageSurvey from '@/lib/components/PostUsageSurvey';
import UserRegistration from '@/lib/components/UserRegistration';
import DeveloperTestPanel from '@/lib/components/DeveloperTestPanel';
import FirebaseStatus from '@/lib/components/FirebaseStatus';
import HamburgerMenu from '@/lib/components/HamburgerMenu';
import MiniCalendar from '@/lib/components/MiniCalendar';
import TaskDrawer from '@/lib/components/TaskDrawer';
import { useTour } from '@/lib/hooks/useTour';

export default function Home() {
  const { checkFirstVisit } = useTour();
  
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
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{content: string} | null>(null);
  const [parsedWords, setParsedWords] = useState<{word: string, reading: string, meaning: string, example: string, exampleTranslation: string}[]>([]);
  const [savingWords, setSavingWords] = useState<Set<number>>(new Set());
  const [savedWords, setSavedWords] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const sessionRecorded = useRef<boolean>(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [voiceUsageCount, setVoiceUsageCount] = useState(0);
  const [showPostSurvey, setShowPostSurvey] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [currentTaskTime, setCurrentTaskTime] = useState<string | null>(null);

  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined') return;
    
    // 檢查用戶 ID
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    // 預載語音庫
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    
    // 檢查流程：用戶註冊 -> 問卷 -> 導覽
    if (!storedUserId) {
      // 沒有用戶ID，顯示註冊介面
      setShowUserRegistration(true);
    } else {
      // 有用戶ID，檢查問卷狀態
      const surveyCompleted = localStorage.getItem('surveyCompleted');
      if (!surveyCompleted) {
        // 延遲1秒後顯示問卷彈窗
        const timer = setTimeout(() => {
          setShowSurvey(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // 問卷已完成，檢查導覽
        checkFirstVisit();
      }
    }
  }, []); // 移除 checkFirstVisit 依賴，避免無限循環

  // 獨立的後問卷檢查 useEffect - 加入更嚴格的控制
  useEffect(() => {
    if (!userId || showPostSurvey) return; // 如果已經顯示問卷，直接返回
    
    // 額外檢查：如果已經觸發過就不要再檢查了
    const alreadyTriggered = localStorage.getItem(`postSurveyTriggered_${userId}`);
    if (alreadyTriggered) return;
    
    const checkPostSurvey = async () => {
      const postSurveyCompleted = localStorage.getItem('postSurveyCompleted');
      const surveyCompleted = localStorage.getItem('surveyCompleted');
      
      // 如果後問卷已完成，或事前問卷未完成，直接返回
      if (postSurveyCompleted || !surveyCompleted) return;
      
      // 檢查是否已經檢查過使用次數
      const lastCheckTime = localStorage.getItem(`lastUsageCheck_${userId}`);
      const now = Date.now();
      
      // 如果 5 分鐘內已檢查過，跳過
      if (lastCheckTime && (now - parseInt(lastCheckTime)) < 5 * 60 * 1000) {
        return;
      }
      
      try {
        // 先檢查本地緩存的使用次數
        const cachedCount = localStorage.getItem(`usageCount_${userId}`);
        
        if (cachedCount && parseInt(cachedCount) >= 5) {
          // 防止重複觸發
          localStorage.setItem(`postSurveyTriggered_${userId}`, 'true');
          setTimeout(() => {
            setShowPostSurvey(true);
          }, 2000);
          return;
        }
        
        // 如果緩存不存在或小於5，才查詢 Firebase
        const q = query(collection(db, 'learningSessions'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const usageCount = querySnapshot.size;
        
        // 緩存查詢結果
        localStorage.setItem(`usageCount_${userId}`, usageCount.toString());
        localStorage.setItem(`lastUsageCheck_${userId}`, now.toString());
        
        console.log(`用戶 ${userId} 使用次數: ${usageCount}`);
        
        if (usageCount >= 5) {
          // 防止重複觸發
          localStorage.setItem(`postSurveyTriggered_${userId}`, 'true');
          setTimeout(() => {
            setShowPostSurvey(true);
          }, 2000);
        }
      } catch (error) {
        console.error('檢查使用次數失敗:', error);
        // 如果是配額錯誤，使用本地計數
        if (error && typeof error === 'object' && 'code' in error && error.code === 'resource-exhausted') {
          const localCount = parseInt(localStorage.getItem('localUsageCount') || '0');
          if (localCount >= 5) {
            localStorage.setItem(`postSurveyTriggered_${userId}`, 'true');
            setTimeout(() => {
              setShowPostSurvey(true);
            }, 2000);
          }
        }
      }
    };
    
    // 執行檢查
    checkPostSurvey();
  }, [userId]); // 移除 showPostSurvey 依賴，避免無限循環

  // 移除 beforeunload 處理器，改為在保存單字時記錄會話（更可靠）

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

          // 提取 ruby 標記中的單字和讀音
          // 讀音：將所有 <ruby>漢字<rt>讀音</rt></ruby> 替換為「讀音」
          let reading = wordWithRuby.replace(/<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/g, '$2');
          // 清理可能遺留的 HTML 標籤
          reading = reading.replace(/<[^>]*>/g, '');

          // 單字：將所有 <ruby>漢字<rt>讀音</rt></ruby> 替換為「漢字」
          let word = wordWithRuby.replace(/<ruby>([^<]+)<rt>[^<]+<\/rt><\/ruby>/g, '$1');
          // 清理可能遺留的 HTML 標籤
          word = word.replace(/<[^>]*>/g, '');
          
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
        continue; // 跳過這個標題行
      }
      
      if (!skipSection) {
        filteredLines.push(line);
      }
    }
    
    return filteredLines.join('\n').trim();
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

  // 更新參與者使用次數 - 加入本地備援機制
  const incrementParticipantUsage = async () => {
    if (!userId) return;
    
    // 先更新本地計數
    const currentLocalCount = parseInt(localStorage.getItem('localUsageCount') || '0');
    const newLocalCount = currentLocalCount + 1;
    localStorage.setItem('localUsageCount', newLocalCount.toString());
    
    // 更新本地緩存
    localStorage.setItem(`usageCount_${userId}`, newLocalCount.toString());
    
    try {
      const q = query(collection(db, 'users'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const currentData = userDoc.data();
        const newUsageCount = (currentData.usageCount || 0) + 1;
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          usageCount: newUsageCount,
          lastUsed: new Date().toISOString()
        });
        
        console.log(`參與者 ${userId} 使用次數更新為: ${newUsageCount}`);
        
        // 檢查是否需要顯示後問卷
        if (newUsageCount >= 5 && !localStorage.getItem('postSurveyCompleted')) {
          setTimeout(() => {
            setShowPostSurvey(true);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('更新參與者使用次數失敗:', error);

      // 如果 Firebase 失敗，使用本地計數檢查後問卷
      if (error && typeof error === 'object' && 'code' in error && error.code === 'resource-exhausted') {
        console.log('使用本地計數機制');
        if (newLocalCount >= 5 && !localStorage.getItem('postSurveyCompleted')) {
          setTimeout(() => {
            setShowPostSurvey(true);
          }, 3000);
        }
      }
    }
  };

  // 記錄學習會話
  const recordLearningSession = async () => {
    if (!sessionStartTime || !content || !userId) return;

    // 防止重複記錄 - 使用 ref 檢查
    if (sessionRecorded.current) {
      console.log('會話已記錄過，跳過重複記錄');
      return;
    }

    // 雙重檢查 - localStorage 防護
    const sessionKey = `session_${sessionStartTime.getTime()}_${userId}`;
    if (localStorage.getItem(sessionKey)) {
      console.log('會話已在 localStorage 中記錄過，跳過重複記錄');
      sessionRecorded.current = true;
      return;
    }

    try {
      const now = new Date();
      const sessionData = {
        userId: userId,
        date: now.toISOString().split('T')[0], // YYYY-MM-DD
        wordsGenerated: parsedWords.length,
        wordsSaved: savedWords.size
      };

      await addDoc(collection(db, 'learningSessions'), sessionData);

      // 標記這個會話已記錄
      localStorage.setItem(sessionKey, 'true');
      sessionRecorded.current = true;

      console.log('學習會話已記錄:', sessionData);
    } catch (error) {
      console.error('記錄學習會話失敗:', error);
    }
  };

  const playSound = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 計數語音使用
      setVoiceUsageCount(prev => prev + 1);
      
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

  const clearContent = async () => {
    // 記錄學習會話（如果有進行中的會話）
    await recordLearningSession();

    setContent(null);
    setParsedWords([]);
    setSavedWords(new Set());
    setSelectedWordIndex(null);
    setSessionStartTime(null);
    sessionRecorded.current = false; // 重置記錄標記
    setCurrentTaskTime(null);
    setVoiceUsageCount(0);
    setSelectedDate(getTodayDate());
    setSelectedCategory('');
    setTaskName('');
  };

  // 處理日曆日期點擊
  const handleDateClick = (date: Date) => {
    // 格式化日期為 YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // 設置選中的日期
    setSelectedDate(dateString);
    
    // 開啟任務抽屜
    setIsTaskDrawerOpen(true);
  };

  // 處理任務提交
  const handleTaskSubmit = async (formData: {
    selectedDate: string;
    selectedTime: string;
    selectedCategory: string;
    taskName: string;
    taskDescription: string;
    reminderEnabled: boolean;
    reminderMinutesBefore: number;
  }) => {
    const { selectedDate: date, selectedTime, selectedCategory: category, taskName: name, taskDescription, reminderEnabled, reminderMinutesBefore } = formData;

    const fullTask = `
日期: ${date}
時間: ${selectedTime}
分類: ${category}
任務名稱: ${name}
詳細描述: ${taskDescription}
    `.trim();

    // 先記錄舊的會話（如果存在）
    if (sessionStartTime && content && !sessionRecorded.current) {
      await recordLearningSession();
    }

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

        // 更新任務相關狀態
        setSelectedCategory(category); // 更新分類，用於保存單字時記錄
        setTaskName(name); // 更新任務名稱

        // 開始學習會話時間記錄
        setSessionStartTime(new Date());
        sessionRecorded.current = false; // 重置記錄標記
        setCurrentTaskTime(selectedTime);
        setVoiceUsageCount(0);
        setSavedWords(new Set());

        // 增加使用次數
        incrementParticipantUsage();

        // 關閉抽屜
        setIsTaskDrawerOpen(false);
        
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
    } catch {
      alert('發生錯誤，請稍後再試');
    }
    setLoading(false);
  };

  const handleUserRegistrationComplete = (newUserId: string) => {
    setUserId(newUserId);
    setShowUserRegistration(false);
    
    // 用戶註冊完成後，檢查問卷狀態
    const surveyCompleted = localStorage.getItem('surveyCompleted');
    if (!surveyCompleted) {
      setTimeout(() => {
        setShowSurvey(true);
      }, 1000);
    } else {
      checkFirstVisit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Firebase 狀態指示器 */}
      <FirebaseStatus />
      
      {/* 用戶註冊模態框 */}
      <UserRegistration
        isOpen={showUserRegistration}
        onComplete={handleUserRegistrationComplete}
        onClose={() => setShowUserRegistration(false)}
      />
      
      <SurveyModal
        isOpen={showSurvey}
        onComplete={() => {
          setShowSurvey(false);
          setShowThankYou(true);
          // 3秒後自動關閉感謝信息並啟動導覽
          setTimeout(() => {
            setShowThankYou(false);
            // 在感謝視窗關閉後啟動網站導覽
            setTimeout(() => {
              checkFirstVisit();
            }, 500);
          }, 3000);
        }}
        onClose={() => {
          setShowSurvey(false);
        }}
      />

      {/* 後問卷 */}
      {showPostSurvey && userId && (
        <PostUsageSurvey
          userId={userId}
          onClose={() => {
            setShowPostSurvey(false);
            // 清理觸發標記，但保持完成標記
            localStorage.setItem(`postSurveyTriggered_${userId}`, 'true');
          }}
        />
      )}

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
                您的寶貴意見將幫助我打造更符合留學生需求的日語學習工具。<br />
                祝您在日本的學習生活順利愉快！
              </p>
            </div>
            <button
              onClick={() => {
                setShowThankYou(false);
                // 手動關閉感謝視窗時也啟動網站導覽
                setTimeout(() => {
                  checkFirstVisit();
                }, 500);
              }}
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
              <h1 id="app-title" className="text-4xl font-bold text-gray-800 mb-2">
                おはよう！早安！
              </h1>
              <p className="text-gray-600">
                記錄你的日常任務，AI會生成相關的日文詞彙
              </p>
            </div>
            <div id="hamburger-menu">
              <HamburgerMenu 
                currentPath="/"
                hasContent={!!content}
                onClearContent={clearContent}
              />
            </div>
          </div>
        </header>

        {/* 小版日曆 */}
        <div id="mini-calendar" className="mb-6">
          <MiniCalendar onDateClick={handleDateClick} />
        </div>

        {/* 空狀態提示 - 當沒有任務記錄時顯示 */}
        {!content && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
            <div className="max-w-md mx-auto">
              <button 
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-200 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedDate(getTodayDate());
                  setIsTaskDrawerOpen(true);
                }}
                title="建立新任務"
              >
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                輸入今天的第一個任務吧！
              </h3>
              <p className="text-gray-600 mb-6">
                點擊下方按鈕或日曆上的日期來創建你的第一個學習任務
              </p>
              <button
                id="create-task-button"
                onClick={() => {
                  setSelectedDate(getTodayDate());
                  setIsTaskDrawerOpen(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center mx-auto space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span>建立第一個任務</span>
              </button>
            </div>
          </div>
        )}

        {/* 任務抽屜 */}
        <TaskDrawer
          isOpen={isTaskDrawerOpen}
          onClose={() => setIsTaskDrawerOpen(false)}
          selectedDate={selectedDate}
          onSubmit={handleTaskSubmit}
          loading={loading}
        />

        {content && (
          <div ref={contentRef} className="space-y-6">
            {/* 單字收藏區域 */}
            {parsedWords.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">關聯詞彙</h2>
                  <p className="text-gray-500 text-sm">
                    點擊單字卡片可以查看例句和詳細資訊
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {parsedWords.map((word, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-300 transition-colors cursor-pointer min-h-[120px] md:min-h-[140px] flex items-center justify-center"
                      onClick={() => setSelectedWordIndex(index)}
                    >
                      <div className="text-center w-full">
                        <p className="text-blue-600 font-medium mb-2 flex items-center justify-center text-sm">
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
                        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
                          {word.word}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">{word.meaning}</p>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">對話例</h2>
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

      {/* 開發者測試面板 - 只在開發環境顯示 */}
      {process.env.NODE_ENV === 'development' && (
        <DeveloperTestPanel
          userId={userId}
          onTriggerPostSurvey={() => setShowPostSurvey(true)}
          onResetAll={() => {
            setUserId(null);
            setShowUserRegistration(true);
          }}
        />
      )}
    </div>
  );
}
