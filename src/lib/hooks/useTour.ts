'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const useTour = () => {
  const driverObj = driver({
    showProgress: true,
    steps: [
      {
        element: '#app-title',
        popover: {
          title: '歡迎使用日語學習應用！',
          description: '這裡是你的日語學習助手，我們會幫你建立待辦事項並生成相關學習內容。',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#mini-calendar',
        popover: {
          title: '學習日曆',
          description: '點擊日曆上的日期來建立待辦事項。',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '#create-task-button',
        popover: {
          title: '建立第一個任務',
          description: '點擊這個按鈕開始建立你的第一個待辦事項！',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#hamburger-menu',
        popover: {
          title: '功能選單',
          description: '點擊這裡可以瀏覽所有功能：新手必備、單字庫、學習統計和設定通知等。',
          side: 'left',
          align: 'start'
        }
      },
      {
        popover: {
          title: '開始你的日語學習之旅！',
          description: '現在你已經了解了基本功能，開始建立你的第一個待辦事項吧！如需重看教學，可以點擊右上角選單 → 設定 → 重新觀看網站導覽。'
        }
      }
    ],
    nextBtnText: '下一步',
    prevBtnText: '上一步', 
    doneBtnText: '開始使用！'
  });

  const startTour = () => {
    driverObj.drive();
  };

  const checkFirstVisit = () => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      // 延遲一下讓頁面完全載入
      setTimeout(() => {
        startTour();
        localStorage.setItem('hasVisitedBefore', 'true');
      }, 1500);
    }
  };

  const resetTour = () => {
    localStorage.removeItem('hasVisitedBefore');
    startTour();
  };

  return {
    startTour,
    checkFirstVisit,
    resetTour
  };
};