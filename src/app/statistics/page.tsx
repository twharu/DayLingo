'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import HamburgerMenu from '@/lib/components/HamburgerMenu';

interface LearningSession {
  id: string;
  userId: string; // 匿名用戶ID
  date: string; // YYYY-MM-DD
  category: string;
  taskName: string;
  wordsGenerated: number;
  wordsSaved: number;
  studyTimeSeconds: number;
  voiceUsageCount: number; // 語音播放次數
  contentGeneratedAt: string; // ISO timestamp
  sessionEndAt: string; // ISO timestamp
}

interface UserStats {
  totalStudyTime: number; // 總學習時間（秒）
  totalWords: number; // 總生成單字數
  totalSavedWords: number; // 總收藏單字數
  totalSessions: number; // 總學習次數
  streakDays: number; // 連續學習天數
  favoriteCategory: string; // 最愛分類
  voiceUsageTotal: number; // 語音使用總次數
  lastStudyDate: string; // 最後學習日期
}

interface CategoryStats {
  category: string;
  sessions: number;
  wordsGenerated: number;
  wordsSaved: number;
  avgSaveRate: number;
}

export default function StatisticsPage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<LearningSession[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  // 生成匿名用戶ID（基於瀏覽器指紋）
  const getAnonymousUserId = () => {
    let userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
      // 基於瀏覽器和時間戳生成匿名ID
      userId = 'user_' + btoa(
        navigator.userAgent.slice(0, 50) + 
        Date.now().toString() + 
        Math.random().toString()
      ).slice(0, 16);
      localStorage.setItem('anonymousUserId', userId);
    }
    return userId;
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const userId = getAnonymousUserId();
      
      // 載入用戶的學習記錄
      const sessionsQuery = query(
        collection(db, 'learningSessions'),
        where('userId', '==', userId),
        orderBy('contentGeneratedAt', 'desc'),
        limit(50)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions: LearningSession[] = [];
      
      sessionsSnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as LearningSession);
      });
      
      setRecentSessions(sessions);
      
      // 計算統計數據
      if (sessions.length > 0) {
        const stats = calculateUserStats(sessions);
        setUserStats(stats);
        
        const catStats = calculateCategoryStats(sessions);
        setCategoryStats(catStats);
      } else {
        // 新用戶，顯示空統計
        setUserStats({
          totalStudyTime: 0,
          totalWords: 0,
          totalSavedWords: 0,
          totalSessions: 0,
          streakDays: 0,
          favoriteCategory: '尚未開始',
          voiceUsageTotal: 0,
          lastStudyDate: ''
        });
      }
      
    } catch (error) {
      console.error('載入統計數據失敗:', error);
    }
    
    setLoading(false);
  };

  const calculateUserStats = (sessions: LearningSession[]): UserStats => {
    const totalStudyTime = sessions.reduce((sum, s) => sum + s.studyTimeSeconds, 0);
    const totalWords = sessions.reduce((sum, s) => sum + s.wordsGenerated, 0);
    const totalSavedWords = sessions.reduce((sum, s) => sum + s.wordsSaved, 0);
    const voiceUsageTotal = sessions.reduce((sum, s) => sum + (s.voiceUsageCount || 0), 0);
    
    // 計算連續學習天數
    const uniqueDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let streakDays = 0;
    const today = new Date().toISOString().split('T')[0];
    
    if (uniqueDates[0] === today || uniqueDates[0] === getPreviousDate(today)) {
      let currentDate = uniqueDates[0];
      for (const date of uniqueDates) {
        if (date === currentDate) {
          streakDays++;
          currentDate = getPreviousDate(currentDate);
        } else {
          break;
        }
      }
    }
    
    // 最愛分類
    const categoryCount: { [key: string]: number } = {};
    sessions.forEach(s => {
      categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
    });
    
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, '尚未開始'
    );
    
    return {
      totalStudyTime,
      totalWords,
      totalSavedWords,
      totalSessions: sessions.length,
      streakDays,
      favoriteCategory,
      voiceUsageTotal,
      lastStudyDate: sessions[0]?.date || ''
    };
  };

  const calculateCategoryStats = (sessions: LearningSession[]): CategoryStats[] => {
    const categoryMap: { [key: string]: CategoryStats } = {};
    
    sessions.forEach(session => {
      if (!categoryMap[session.category]) {
        categoryMap[session.category] = {
          category: session.category,
          sessions: 0,
          wordsGenerated: 0,
          wordsSaved: 0,
          avgSaveRate: 0
        };
      }
      
      const cat = categoryMap[session.category];
      cat.sessions++;
      cat.wordsGenerated += session.wordsGenerated;
      cat.wordsSaved += session.wordsSaved;
      cat.avgSaveRate = cat.wordsGenerated > 0 ? (cat.wordsSaved / cat.wordsGenerated) * 100 : 0;
    });
    
    return Object.values(categoryMap).sort((a, b) => b.sessions - a.sessions);
  };

  const getPreviousDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分鐘`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小時${minutes}分鐘`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入學習統計中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                學習統計
              </h1>
              <p className="text-gray-600">
                追蹤你的日語學習進度和成果
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                回到首頁
              </Link>
              <HamburgerMenu currentPath="/statistics" />
            </div>
          </div>
        </header>

        {userStats && (
          <div className="space-y-6">
            {/* 總體統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🔥</div>
                  <div>
                    <p className="text-sm text-gray-600">連續學習</p>
                    <p className="text-2xl font-bold text-blue-600">{userStats.streakDays}</p>
                    <p className="text-sm text-gray-500">天</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📚</div>
                  <div>
                    <p className="text-sm text-gray-600">學習單字</p>
                    <p className="text-2xl font-bold text-green-600">{userStats.totalWords}</p>
                    <p className="text-sm text-gray-500">個</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⭐</div>
                  <div>
                    <p className="text-sm text-gray-600">收藏單字</p>
                    <p className="text-2xl font-bold text-purple-600">{userStats.totalSavedWords}</p>
                    <p className="text-sm text-gray-500">個</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏱️</div>
                  <div>
                    <p className="text-sm text-gray-600">學習時間</p>
                    <p className="text-lg font-bold text-orange-600">{formatTime(userStats.totalStudyTime)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 詳細統計 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 分類統計 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">學習分類統計</h2>
                {categoryStats.length > 0 ? (
                  <div className="space-y-3">
                    {categoryStats.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-800">{cat.category}</p>
                          <p className="text-sm text-gray-600">
                            {cat.sessions}次學習 • {cat.wordsGenerated}個單字
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{cat.avgSaveRate.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">收藏率</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">尚無學習記錄</p>
                )}
              </div>

              {/* 最近學習記錄 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">最近學習記錄</h2>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentSessions.slice(0, 10).map((session, index) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{session.taskName}</p>
                            <p className="text-sm text-gray-600">{session.category}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-500">{formatDate(session.date)}</p>
                            <p className="text-blue-600">{session.wordsSaved}/{session.wordsGenerated} 收藏</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">尚無學習記錄</p>
                )}
              </div>
            </div>

            {/* 語音使用統計 */}
            {userStats.voiceUsageTotal > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">功能使用統計</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🔊</div>
                    <p className="text-2xl font-bold text-blue-600">{userStats.voiceUsageTotal}</p>
                    <p className="text-sm text-gray-600">語音播放次數</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-2xl font-bold text-green-600">{userStats.totalSessions}</p>
                    <p className="text-sm text-gray-600">學習次數</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">❤️</div>
                    <p className="text-2xl font-bold text-purple-600">{userStats.favoriteCategory}</p>
                    <p className="text-sm text-gray-600">最愛分類</p>
                  </div>
                </div>
              </div>
            )}

            {/* 數據隱私說明 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-2">🔒 隱私保護說明</h3>
              <p className="text-yellow-700 text-sm">
                所有學習數據都是匿名化處理，僅用於改善學習體驗和學術研究。我們不會收集任何個人身份資訊，您的隱私完全受到保護。
              </p>
            </div>
          </div>
        )}

        {!userStats?.totalSessions && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">開始你的學習統計</h2>
            <p className="text-gray-600 mb-6">
              使用 AI 生成學習內容後，這裡會顯示你的學習進度和統計資料
            </p>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              開始學習
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}