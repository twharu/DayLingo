'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import SurveyModal from '@/lib/components/SurveyModal';
import PostUsageSurvey from '@/lib/components/PostUsageSurvey';
import UserRegistration from '@/lib/components/UserRegistration';
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
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{content: string} | null>(null);
  const [parsedWords, setParsedWords] = useState<{
    word: string,
    reading: string,
    meaning: string,
    example: string,
    exampleTranslation: string,
    phrase?: string,
    phraseTranslation?: string,
    dialogueA?: string,
    dialogueATranslation?: string,
    dialogueB?: string,
    dialogueBTranslation?: string
  }[]>([]);
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
  const [showPostSurvey, setShowPostSurvey] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

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
      // 有用戶ID，檢查 Firebase 是否已有問卷記錄
      checkSurveyStatus(storedUserId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 移除 checkFirstVisit 依賴，避免無限循環

  // 檢查用戶是否已填寫事前問卷
  const checkSurveyStatus = useCallback(async (userId: string) => {
    try {
      // 先檢查 localStorage 緩存
      const cachedStatus = localStorage.getItem('surveyCompleted');
      console.log('[Survey Check] userId:', userId);
      console.log('[Survey Check] localStorage surveyCompleted:', cachedStatus);

      if (cachedStatus === 'true') {
        console.log('[Survey Check] Using cached status - survey already completed');
        checkFirstVisit();
        return;
      }

      // 查詢 Firebase 是否有該用戶的問卷記錄
      console.log('[Survey Check] Querying Firebase for userId:', userId);
      const q = query(
        collection(db, 'surveyResponses'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      console.log('[Survey Check] Firebase query result - empty?', querySnapshot.empty, 'size:', querySnapshot.size);

      if (!querySnapshot.empty) {
        // 用戶已填寫過問卷，更新緩存並直接啟動導覽
        console.log('[Survey Check] Found survey response in Firebase, updating cache');
        querySnapshot.forEach(doc => {
          console.log('[Survey Check] Survey document:', doc.id, doc.data());
        });
        localStorage.setItem('surveyCompleted', 'true');
        // 直接啟動導覽，不顯示問卷
        checkFirstVisit();
      } else {
        // 用戶未填寫問卷，顯示問卷彈窗
        console.log('[Survey Check] No survey found - showing survey modal');
        setTimeout(() => {
          setShowSurvey(true);
        }, 1000);
      }
    } catch (error) {
      console.error('[Survey Check] Error checking survey status:', error);
      // 發生錯誤時，檢查 localStorage
      const cachedStatus = localStorage.getItem('surveyCompleted');
      if (cachedStatus === 'true') {
        console.log('[Survey Check] Error occurred but using cached status');
        checkFirstVisit();
      } else {
        console.log('[Survey Check] Error occurred and no cache - showing survey');
        setTimeout(() => {
          setShowSurvey(true);
        }, 1000);
      }
    }
  }, [checkFirstVisit]);

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

      // 如果 1 小時內已檢查過，跳過
      if (lastCheckTime && (now - parseInt(lastCheckTime)) < 60 * 60 * 1000) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // 移除 showPostSurvey 依賴，避免無限循環

  // 移除 beforeunload 處理器，改為在保存單字時記錄會話（更可靠）

  const parseWords = (content: string) => {
    const words = [];
    const lines = content.split('\n');
    let currentSection = '';

    console.log('🔍 開始解析，總共', lines.length, '行');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 檢查區塊標題
      if (line.includes('關聯單字') || line.includes('## 關聯單字') || line.includes('### 單字列表') || line.includes('單字列表')) {
        currentSection = 'words';
        console.log('✅ 找到關聯單字區塊');
        continue;
      }

      if (line.includes('## 日常對話') || line.includes('### 日常對話')) {
        currentSection = '';
        console.log('✅ 找到日常對話區塊，停止解析單字');
        continue;
      }

      // 解析單字（支持 "1." 或 "### 1." 格式）
      // 如果遇到 ### 1. 格式，自動進入 words section
      if (line.match(/^###\s*1\./)) {
        currentSection = 'words';
        console.log('✅ 自動檢測到單字區塊開始 (### 1. 格式)');
      }

      if (currentSection === 'words' && line.match(/^(###\s*)?\d+\./)) {
        // 移除數字編號和可能的 ### 前綴
        const cleanLine = line.replace(/^###\s*\d+\.\s*/, '').replace(/^\d+\.\s*/, '');
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

          // 找詞組
          let phrase = '';
          let phraseTranslation = '';
          if (i + 2 < lines.length && lines[i + 2].includes('詞組：')) {
            const phraseLine = lines[i + 2];
            const phraseMatch = phraseLine.match(/詞組：(.+?)\s*-\s*(.+)$/);
            if (phraseMatch) {
              phrase = phraseMatch[1].trim();
              phraseTranslation = phraseMatch[2].trim();
            }
          }

          // 找小對話
          let dialogueA = '';
          let dialogueATranslation = '';
          let dialogueB = '';
          let dialogueBTranslation = '';

          // 從當前位置開始找「小對話：」標記
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            if (lines[j].includes('小對話：')) {
              // 找 A:
              if (j + 1 < lines.length && lines[j + 1].trim().startsWith('A:')) {
                const dialogueALine = lines[j + 1].trim().substring(2).trim(); // 移除 "A:"
                const dialogueAMatch = dialogueALine.match(/^(.+?)\s*-\s*(.+)$/);
                if (dialogueAMatch) {
                  dialogueA = dialogueAMatch[1].trim();
                  dialogueATranslation = dialogueAMatch[2].trim();
                }
              }
              // 找 B:
              if (j + 2 < lines.length && lines[j + 2].trim().startsWith('B:')) {
                const dialogueBLine = lines[j + 2].trim().substring(2).trim(); // 移除 "B:"
                const dialogueBMatch = dialogueBLine.match(/^(.+?)\s*-\s*(.+)$/);
                if (dialogueBMatch) {
                  dialogueB = dialogueBMatch[1].trim();
                  dialogueBTranslation = dialogueBMatch[2].trim();
                }
              }
              break;
            }
          }

          const item = {
            word: word.trim(),
            reading: reading.trim(),
            meaning: meaning.trim(),
            example,
            exampleTranslation,
            phrase,
            phraseTranslation,
            dialogueA,
            dialogueATranslation,
            dialogueB,
            dialogueBTranslation
          };

          if (word && reading && meaning) {
            words.push(item);
            console.log(`📌 解析到第 ${words.length} 個單字:`, word, reading, meaning);
            console.log(`   - 對話A: ${dialogueA ? '✅' : '❌'}`);
            console.log(`   - 對話B: ${dialogueB ? '✅' : '❌'}`);
          } else {
            console.log('⚠️ 單字解析失敗，缺少必要欄位:', { word, reading, meaning });
          }
        }
      }
    }

    console.log('✅ 解析完成，總共解析到', words.length, '個單字');
    setParsedWords(words);
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
      // 停止當前播放
      window.speechSynthesis.cancel();

      // 預處理日語文字
      const processedText = preprocessJapaneseText(text);
      console.log('原文:', text, '處理後:', processedText);

      const utterance = new SpeechSynthesisUtterance(processedText);
      utterance.lang = 'ja-JP'; // 設定為日語
      utterance.rate = 0.55; // 非常慢的語速，便於學習
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
    setSelectedDate(getTodayDate());
    setSelectedCategory('');
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
    selectedCategory: string;
    taskName: string;
    taskDescription: string;
  }) => {
    const { selectedDate: date, selectedCategory: category, taskName: name, taskDescription } = formData;

    const fullTask = `
日期: ${date}
分類: ${category}
任務名稱: ${name}
詳細描述: ${taskDescription}
    `.trim();

    // 先記錄舊的會話（如果存在）
    if (sessionStartTime && content && !sessionRecorded.current) {
      await recordLearningSession();
    }

    // 先關閉抽屜，讓用戶看到 loading 動畫
    setIsTaskDrawerOpen(false);

    // 稍微延遲一下確保抽屜關閉動畫完成
    await new Promise(resolve => setTimeout(resolve, 300));

    setLoading(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '', // 傳送用戶 ID 進行身份驗證
        },
        body: JSON.stringify({ task: fullTask }),
      });

      // 處理速率限制錯誤
      if (response.status === 429) {
        const errorData = await response.json();
        alert(`⚠️ ${errorData.error}\n\n請稍後再試。`);
        setLoading(false);
        return;
      }

      // 處理身份驗證錯誤
      if (response.status === 401) {
        const errorData = await response.json();
        alert(`🔒 ${errorData.error}\n\n請重新登入。`);
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('📝 收到的完整內容:', data.content);
        setContent(data);
        parseWords(data.content);

        // 更新任務相關狀態
        setSelectedCategory(category); // 更新分類，用於保存單字時記錄

        // 開始學習會話時間記錄
        setSessionStartTime(new Date());
        sessionRecorded.current = false; // 重置記錄標記
        setSavedWords(new Set());

        // 增加使用次數
        incrementParticipantUsage();

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

  const handleUserRegistrationComplete = useCallback((newUserId: string) => {
    setUserId(newUserId);
    setShowUserRegistration(false);

    // 用戶註冊完成後，檢查 Firebase 問卷狀態（不只看 localStorage）
    checkSurveyStatus(newUserId);
  }, [checkSurveyStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Firebase 狀態指示器 */}
      <FirebaseStatus />
      
      {/* 用戶註冊模態框 */}
      <UserRegistration
        isOpen={showUserRegistration}
        onComplete={handleUserRegistrationComplete}
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
          // 即使關閉問卷，也要檢查是否已填寫過（從 Firebase 查到的）
          const surveyCompleted = localStorage.getItem('surveyCompleted');
          if (surveyCompleted === 'true') {
            checkFirstVisit();
          }
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
              開始學習
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
                輸入待辦事項，由AI生成相關的日文詞彙
              </p>
            </div>
            <div id="hamburger-menu">
              <HamburgerMenu
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

        {/* 空狀態提示 - 當沒有任務記錄且不在載入中時顯示 */}
        {!content && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
            <div className="max-w-md mx-auto">
              <button 
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-200 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedDate(getTodayDate());
                  setIsTaskDrawerOpen(true);
                }}
                title="建立待辦事項"
              >
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                輸入今天的第一個待辦事項吧！
              </h3>
              <p className="text-gray-600 mb-6">
                點擊下方按鈕或日曆上的日期
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
                <span>建立待辦事項</span>
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
            {/* 關聯單字區域 */}
            {parsedWords.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">關聯單字</h2>
                  <p className="text-gray-500 text-sm">
                    點擊單字查看例句
                  </p>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                  {parsedWords.map((word, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-2 md:p-3 hover:border-blue-300 transition-colors cursor-pointer min-h-[100px] md:min-h-[120px] flex items-center justify-center"
                      onClick={() => setSelectedWordIndex(index)}
                    >
                      <div className="text-center w-full">
                        <p className="text-blue-600 font-medium mb-1 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound(word.reading);
                            }}
                            className="mr-1 hover:scale-110 transition-transform p-0.5 rounded-full hover:bg-blue-100"
                            title="播放讀音"
                          >
                            <Image
                              src="/icons/volume.svg"
                              alt="播放讀音"
                              width={12}
                              height={12}
                            />
                          </button>
                          <span className="text-xs">{word.reading}</span>
                        </p>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">
                          {word.word}
                        </h3>
                        <p className="text-xs text-gray-600 mb-1 md:mb-2 line-clamp-2">{word.meaning}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveWord(index);
                          }}
                          disabled={savingWords.has(index) || savedWords.has(index)}
                          className={`w-full px-2 py-1 rounded transition-colors text-xs ${
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
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
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
                        </button>
                      </div>
                      <p className="text-gray-800 text-lg leading-relaxed mb-2">
                        <span
                          className="ruby-content"
                          dangerouslySetInnerHTML={{ __html: parsedWords[selectedWordIndex].example }}
                          style={{ fontSize: '18px', lineHeight: '2' }}
                        />
                      </p>
                      <p className="text-gray-600">{parsedWords[selectedWordIndex].exampleTranslation}</p>
                    </div>
                  )}

                  {parsedWords[selectedWordIndex].phrase && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">相關詞組：</h4>
                        <button
                          onClick={() => {
                            let cleanPhrase = parsedWords[selectedWordIndex].phrase || '';
                            cleanPhrase = cleanPhrase.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1');
                            cleanPhrase = cleanPhrase.replace(/<[^>]*>/g, '');
                            playSound(cleanPhrase);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors text-sm"
                          title="播放詞組"
                        >
                          <Image
                            src="/icons/volume.svg"
                            alt="播放詞組"
                            width={16}
                            height={16}
                          />
                        </button>
                      </div>
                      <p className="text-gray-800 text-lg leading-relaxed mb-2">
                        <span
                          className="ruby-content"
                          dangerouslySetInnerHTML={{ __html: parsedWords[selectedWordIndex].phrase }}
                          style={{ fontSize: '18px', lineHeight: '2' }}
                        />
                      </p>
                      <p className="text-gray-600">{parsedWords[selectedWordIndex].phraseTranslation}</p>
                    </div>
                  )}

                  {parsedWords[selectedWordIndex].dialogueA && parsedWords[selectedWordIndex].dialogueB && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">對話練習：</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-purple-600">A:</span>
                            <button
                              onClick={() => {
                                let cleanDialogueA = parsedWords[selectedWordIndex].dialogueA || '';
                                cleanDialogueA = cleanDialogueA.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1');
                                cleanDialogueA = cleanDialogueA.replace(/<[^>]*>/g, '');
                                playSound(cleanDialogueA);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-100 rounded transition-colors text-sm"
                              title="播放對話"
                            >
                              <Image
                                src="/icons/volume.svg"
                                alt="播放"
                                width={14}
                                height={14}
                              />
                            </button>
                          </div>
                          <p className="text-gray-800 mb-1 leading-relaxed">
                            <span
                              className="ruby-content"
                              dangerouslySetInnerHTML={{ __html: parsedWords[selectedWordIndex].dialogueA }}
                              style={{ fontSize: '16px', lineHeight: '1.8' }}
                            />
                          </p>
                          <p className="text-gray-600 text-sm">{parsedWords[selectedWordIndex].dialogueATranslation}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-purple-600">B:</span>
                            <button
                              onClick={() => {
                                let cleanDialogueB = parsedWords[selectedWordIndex].dialogueB || '';
                                cleanDialogueB = cleanDialogueB.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1');
                                cleanDialogueB = cleanDialogueB.replace(/<[^>]*>/g, '');
                                playSound(cleanDialogueB);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-100 rounded transition-colors text-sm"
                              title="播放對話"
                            >
                              <Image
                                src="/icons/volume.svg"
                                alt="播放"
                                width={14}
                                height={14}
                              />
                            </button>
                          </div>
                          <p className="text-gray-800 mb-1 leading-relaxed">
                            <span
                              className="ruby-content"
                              dangerouslySetInnerHTML={{ __html: parsedWords[selectedWordIndex].dialogueB }}
                              style={{ fontSize: '16px', lineHeight: '1.8' }}
                            />
                          </p>
                          <p className="text-gray-600 text-sm">{parsedWords[selectedWordIndex].dialogueBTranslation}</p>
                        </div>
                      </div>
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


          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            {/* 雙圈旋轉動畫 */}
            <div className="relative inline-block mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600"></div>
              <div
                className="absolute top-3 left-3 rounded-full h-14 w-14 border-4 border-purple-200 border-b-purple-600"
                style={{
                  animation: 'spin 1.5s linear infinite reverse'
                }}
              ></div>
            </div>

            {/* 主標題 */}
            <h3 className="text-xl font-bold text-gray-800 mb-3 animate-pulse">
              AI 正在為您生成學習內容
            </h3>

            {/* 跳動的點點 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce"></span>
              <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
              <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>

            {/* 進度說明 */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">分析任務內容中</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>

              <p className="text-gray-400 text-xs pt-3">
                預計需要 30-60 秒，請稍候
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
