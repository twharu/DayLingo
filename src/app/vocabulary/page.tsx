'use client';

import { useState, useEffect, Suspense } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import HamburgerMenu from '@/lib/components/HamburgerMenu';

interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  phrase?: string;
  phraseTranslation?: string;
  dialogueA?: string;
  dialogueATranslation?: string;
  dialogueB?: string;
  dialogueBTranslation?: string;
  category?: string;
  taskId?: string;
  taskName?: string;
  date?: string;
  savedAt: string;
}

interface GroupedWords {
  [date: string]: {
    [taskName: string]: SavedWord[];
  };
}

function VocabularyContent() {
  const searchParams = useSearchParams();
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<SavedWord | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  // 處理 URL 參數，自動展開指定的日期和待辦事項
  useEffect(() => {
    if (savedWords.length === 0) return;

    const dateParam = searchParams.get('date');
    const taskNameParam = searchParams.get('taskName');

    if (dateParam && taskNameParam) {
      // 自動展開指定的日期
      setExpandedDates(prev => new Set(prev).add(dateParam));

      // 自動展開指定的待辦事項
      const taskKey = `${dateParam}-${taskNameParam}`;
      setExpandedTasks(prev => new Set(prev).add(taskKey));

      // 滾動到對應位置（延遲一下確保DOM已渲染）
      setTimeout(() => {
        const taskElement = document.querySelector(`[data-task-key="${taskKey}"]`);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [savedWords, searchParams]);

  const loadSavedWords = async () => {
    try {
      // 確保有 userId
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('未找到 userId，無法載入單字');
        setSavedWords([]);
        setLoading(false);
        return;
      }

      // 只查詢該使用者的單字
      const q = query(
        collection(db, 'savedWords'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const words: SavedWord[] = [];
      querySnapshot.forEach((doc) => {
        words.push({ id: doc.id, ...doc.data() } as SavedWord);
      });
      // 按日期排序（最新的在前）
      words.sort((a, b) => {
        const dateA = a.date || a.savedAt.split('T')[0];
        const dateB = b.date || b.savedAt.split('T')[0];
        return dateB.localeCompare(dateA);
      });
      setSavedWords(words);
    } catch (error) {
      console.error('載入單字失敗:', error);
    }
    setLoading(false);
  };

  // 將單字按日期和待辦事項分組
  const groupWordsByDateAndTask = (): GroupedWords => {
    const grouped: GroupedWords = {};

    savedWords.forEach(word => {
      const date = word.date || word.savedAt.split('T')[0];
      const taskName = word.taskName || '未分類';

      if (!grouped[date]) {
        grouped[date] = {};
      }

      if (!grouped[date][taskName]) {
        grouped[date][taskName] = [];
      }

      grouped[date][taskName].push(word);
    });

    return grouped;
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const toggleTask = (dateTask: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(dateTask)) {
      newExpanded.delete(dateTask);
    } else {
      newExpanded.add(dateTask);
    }
    setExpandedTasks(newExpanded);
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
            <p className="mt-2 text-gray-700">載入單字庫中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                單字庫
              </h1>
              <p className="text-gray-700">
                已收藏 {savedWords.length} 個單字
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HamburgerMenu />
            </div>
          </div>
        </header>


        {savedWords.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">單字庫是空的</h2>
            <p className="text-gray-700 mb-6">
              開始學習並收藏你喜歡的單字吧！
            </p>
          </div>
        ) : (
          <>
            {/* 按日期和待辦事項分組顯示 */}
            <div className="space-y-4">
              {(() => {
                const grouped = groupWordsByDateAndTask();
                const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

                return dates.map(date => {
                  const isDateExpanded = expandedDates.has(date);
                  const tasks = grouped[date];
                  const taskNames = Object.keys(tasks);
                  const wordCount = taskNames.reduce((sum, taskName) => sum + tasks[taskName].length, 0);

                  return (
                    <div key={date} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      {/* 日期標題 */}
                      <button
                        onClick={() => toggleDate(date)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-gray-600 transition-transform ${isDateExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h3 className="text-lg font-semibold text-gray-800">{date}</h3>
                        </div>
                        <span className="text-sm text-gray-600">{wordCount} 個單字</span>
                      </button>

                      {/* 待辦事項列表 */}
                      {isDateExpanded && (
                        <div className="border-t border-gray-200">
                          {taskNames.map(taskName => {
                            const taskKey = `${date}-${taskName}`;
                            const isTaskExpanded = expandedTasks.has(taskKey);
                            const words = tasks[taskName];

                            return (
                              <div key={taskKey} data-task-key={taskKey} className="border-b border-gray-100 last:border-b-0">
                                {/* 待辦事項標題 */}
                                <button
                                  onClick={() => toggleTask(taskKey)}
                                  className="w-full p-4 pl-12 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <svg
                                      className={`w-4 h-4 text-gray-600 transition-transform ${isTaskExpanded ? 'rotate-90' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <h4 className="font-medium text-gray-800">{taskName}</h4>
                                  </div>
                                  <span className="text-sm text-gray-600">{words.length} 個單字</span>
                                </button>

                                {/* 單字卡片 */}
                                {isTaskExpanded && (
                                  <div className="p-4 pl-16 bg-gray-50">
                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                      {words.map((word) => (
                                        <div
                                          key={word.id}
                                          className="relative border border-gray-200 bg-white rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer min-h-[120px] flex items-center justify-center"
                                          onClick={() => setSelectedWord(word)}
                                        >
                                          {/* 刪除按鈕 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteWord(word.id);
                                            }}
                                            className="absolute top-1 right-1 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                                            title="刪除單字"
                                          >
                                            <Image
                                              src="/icons/delete.svg"
                                              alt="刪除"
                                              width={14}
                                              height={14}
                                            />
                                          </button>

                                          {/* 分類標籤 */}
                                          {word.category && (
                                            <span className="absolute top-1 left-1 bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded">
                                              {word.category}
                                            </span>
                                          )}

                                          <div className="text-center w-full mt-6">
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
                                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                                              {word.word.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1').replace(/<[^>]*>/g, '')}
                                            </h3>
                                            <p className="text-xs text-gray-700 line-clamp-2">{word.meaning}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* 單字詳細彈窗 */}
            {selectedWord && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedWord(null)}>
                  <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {selectedWord.category && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              {selectedWord.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {selectedWord.word.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1').replace(/<[^>]*>/g, '')}
                        </h3>
                        <p className="text-lg text-gray-700 mb-3">{selectedWord.meaning}</p>
                        <p className="text-blue-600 font-medium flex items-center">
                          <button
                            onClick={() => playSound(selectedWord.reading)}
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
                          {selectedWord.reading}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedWord(null)}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    {selectedWord.example && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">例句：</h4>
                          <button
                            onClick={() => {
                              let cleanExample = selectedWord.example;
                              cleanExample = cleanExample.replace(/<ruby>([^<]+)<rt>[^<]*<\/rt><\/ruby>/g, '$1');
                              cleanExample = cleanExample.replace(/<[^>]*>/g, '');
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
                            dangerouslySetInnerHTML={{ __html: selectedWord.example }}
                            style={{ fontSize: '18px', lineHeight: '2' }}
                          />
                        </p>
                        <p className="text-gray-700">{selectedWord.exampleTranslation}</p>
                      </div>
                    )}

                    {selectedWord.phrase && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">相關詞組：</h4>
                          <button
                            onClick={() => {
                              let cleanPhrase = selectedWord.phrase || '';
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
                            dangerouslySetInnerHTML={{ __html: selectedWord.phrase }}
                            style={{ fontSize: '18px', lineHeight: '2' }}
                          />
                        </p>
                        <p className="text-gray-700">{selectedWord.phraseTranslation}</p>
                      </div>
                    )}

                    {selectedWord.dialogueA && selectedWord.dialogueB && (
                      <div className="bg-purple-50 p-4 rounded-lg mb-4">
                        <h4 className="font-medium text-gray-800 mb-3">對話練習：</h4>
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-purple-600">A:</span>
                              <button
                                onClick={() => {
                                  let cleanDialogueA = selectedWord.dialogueA || '';
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
                                dangerouslySetInnerHTML={{ __html: selectedWord.dialogueA }}
                                style={{ fontSize: '16px', lineHeight: '1.8' }}
                              />
                            </p>
                            <p className="text-gray-700 text-sm">{selectedWord.dialogueATranslation}</p>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-purple-600">B:</span>
                              <button
                                onClick={() => {
                                  let cleanDialogueB = selectedWord.dialogueB || '';
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
                                dangerouslySetInnerHTML={{ __html: selectedWord.dialogueB }}
                                style={{ fontSize: '16px', lineHeight: '1.8' }}
                              />
                            </p>
                            <p className="text-gray-700 text-sm">{selectedWord.dialogueBTranslation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      收藏時間：{new Date(selectedWord.savedAt).toLocaleString('zh-TW')}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          deleteWord(selectedWord.id);
                          setSelectedWord(null);
                        }}
                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        刪除這個單字
                      </button>
                      <button
                        onClick={() => setSelectedWord(null)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-700">載入單字庫中...</p>
          </div>
        </div>
      </div>
    }>
      <VocabularyContent />
    </Suspense>
  );
}