'use client';

import { useState } from 'react';

interface MiniCalendarProps {
  onDateClick?: (date: Date) => void;
}

export default function MiniCalendar({ onDateClick }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());


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
        isCurrentMonth: false
      });
    }
    
    // 當月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true
      });
    }
    
    // 下個月的日期（灰色）補齊42格（6週）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false
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
        {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => onDateClick?.(day.date)}
              className={`
                h-8 flex items-center justify-center text-xs font-medium rounded transition-all cursor-pointer
                ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}
                ${isToday(day.date) ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-500' : 'hover:bg-gray-50'}
                hover:bg-blue-50
              `}
            >
              {day.date.getDate()}
            </div>
          ))}
      </div>
      
      {/* 圖例 */}
      <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-100 border border-blue-500 rounded"></div>
          <span>今天</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-200 rounded"></div>
          <span>點擊日期建立任務</span>
        </div>
      </div>
    </div>
  );
}