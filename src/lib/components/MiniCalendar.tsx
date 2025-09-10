'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StudyRecord {
  id: string;
  date: string;
  category: string;
  taskName: string;
  wordsGenerated: number;
  wordsSaved: number;
  studyTimeSeconds: number;
}

interface MiniCalendarProps {
  onDateClick?: (date: Date) => void;
}

export default function MiniCalendar({ onDateClick }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
    // 只顯示今天或之前的記錄
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

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, index) => (
              <div key={index} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* 月份導航 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-sm font-semibold text-gray-800">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 星期標題 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 日曆格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const hasRecords = day.records.length > 0;
          
          return (
            <div
              key={index}
              onClick={() => onDateClick?.(day.date)}
              className={`
                h-8 flex items-center justify-center text-xs font-medium rounded transition-all relative cursor-pointer
                ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}
                ${isToday(day.date) ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-500' : ''}
                ${hasRecords ? 'bg-green-100 text-green-800' : ''}
                ${!hasRecords && !isToday(day.date) ? 'hover:bg-gray-50' : ''}
                hover:bg-blue-50
              `}
            >
              {day.date.getDate()}
              
              {hasRecords && (
                <div className="absolute top-1 right-1 w-1 h-1 bg-green-600 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 圖例 */}
      <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-100 border border-blue-500 rounded"></div>
          <span>今天</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-100 rounded"></div>
          <span>有學習記錄</span>
        </div>
      </div>
    </div>
  );
}