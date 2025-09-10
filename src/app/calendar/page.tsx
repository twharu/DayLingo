'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import HamburgerMenu from '@/lib/components/HamburgerMenu';

interface StudyRecord {
  id: string;
  date: string;
  time?: string;
  category: string;
  taskName: string;
  wordsGenerated: number;
  wordsSaved: number;
  studyTimeSeconds: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);

  // 取得當月學習記錄
  useEffect(() => {
    const fetchStudyRecords = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const q = query(
          collection(db, 'learningSessions'),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );

        const querySnapshot = await getDocs(q);
        const records: StudyRecord[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            id: doc.id,
            date: data.date,
            time: data.time || '09:00',
            category: data.category,
            taskName: data.taskName,
            wordsGenerated: data.wordsGenerated || 0,
            wordsSaved: data.wordsSaved || 0,
            studyTimeSeconds: data.studyTimeSeconds || 0
          });
        });

        setStudyRecords(records);
      } catch (error) {
        console.error('載入學習記錄失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyRecords();
  }, [currentDate]);

  // 取得指定日期的記錄
  const getRecordsForDate = (date: Date): StudyRecord[] => {
    const dateString = date.toISOString().split('T')[0];
    // 只顯示今天或之前的記錄，不顯示未來日期的記錄
    const today = new Date();
    if (date > today) {
      return [];
    }
    return studyRecords.filter(record => record.date === dateString);
  };

  // 生成日曆格子
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // 上個月的日期（灰色）
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDay = new Date(year, month, -i);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        records: []
      });
    }
    
    // 當月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const records = getRecordsForDate(date);
      days.push({
        date,
        isCurrentMonth: true,
        records
      });
    }
    
    // 下個月的日期（灰色）補齊42格（6週）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        records: []
      });
    }
    
    return days;
  };

  // 導航到上/下月
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 點擊日期顯示詳情
  const handleDateClick = (date: Date, records: StudyRecord[]) => {
    setSelectedDate(date);
    setTodayRecords(records);
  };

  // 格式化時間
  const formatStudyTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}分鐘`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小時${remainingMinutes}分鐘`;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* 標題列 */}
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">學習日曆</h1>
              <p className="text-gray-600">追蹤您的日語學習進度</p>
            </div>
            <HamburgerMenu currentPath="/calendar" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主日曆區域 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* 月份導航 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 星期標題 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <div key={index} className="p-2 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日曆格子 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const hasRecords = day.records.length > 0;
                  const totalStudyTime = day.records.reduce((sum, record) => sum + record.studyTimeSeconds, 0);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => hasRecords && handleDateClick(day.date, day.records)}
                      className={`
                        min-h-[80px] p-2 border border-gray-200 cursor-pointer transition-all relative
                        ${day.isCurrentMonth ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 text-gray-400'}
                        ${isToday(day.date) ? 'ring-2 ring-blue-500' : ''}
                        ${hasRecords ? 'bg-green-50 border-green-200 hover:bg-green-100' : ''}
                      `}
                    >
                      <div className="text-sm font-medium">
                        {day.date.getDate()}
                      </div>
                      
                      {hasRecords && (
                        <div className="mt-1 space-y-1">
                          {day.records
                            .sort((a, b) => (a.time || '09:00').localeCompare(b.time || '09:00'))
                            .slice(0, 2)
                            .map((record, idx) => (
                            <div key={idx} className="text-xs text-green-600 font-medium truncate">
                              <span className="text-gray-500 text-xs">{record.time}</span> {record.taskName}
                            </div>
                          ))}
                          {day.records.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{day.records.length - 2}個任務
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isToday(day.date) && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 側邊詳情區域 */}
          <div className="space-y-6">
            {/* 今日/選中日期詳情 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedDate 
                  ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 詳情`
                  : '選擇日期查看詳情'
                }
              </h3>
              
              {selectedDate && todayRecords.length > 0 ? (
                <div className="space-y-4">
                  {todayRecords
                    .sort((a, b) => (a.time || '09:00').localeCompare(b.time || '09:00'))
                    .map((record) => (
                    <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{record.taskName}</h4>
                        <span className="text-sm text-blue-600 font-medium">{record.time}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>分類：{record.category}</div>
                        <div>生成詞彙：{record.wordsGenerated}個</div>
                        <div>收藏詞彙：{record.wordsSaved}個</div>
                        <div>學習時間：{formatStudyTime(record.studyTimeSeconds)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDate && todayRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">這天沒有學習記錄</p>
              ) : (
                <p className="text-gray-500 text-center py-8">點擊日曆上的日期查看學習記錄</p>
              )}
            </div>

            {/* 本月統計 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">本月統計</h3>
              
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">學習天數</span>
                    <span className="font-medium">
                      {new Set(studyRecords.map(r => r.date)).size}天
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">完成任務</span>
                    <span className="font-medium">{studyRecords.length}個</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">總學習時間</span>
                    <span className="font-medium">
                      {formatStudyTime(studyRecords.reduce((sum, r) => sum + r.studyTimeSeconds, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">收藏詞彙</span>
                    <span className="font-medium">
                      {studyRecords.reduce((sum, r) => sum + r.wordsSaved, 0)}個
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}