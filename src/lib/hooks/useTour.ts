'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export const useTour = () => {
  const driverObj = driver({
    showProgress: true,
    steps: [
      {
        element: '#app-title',
        popover: {
          title: '歡迎使用DayLingo！',
          description: '這裡是你的日文單字學習助手，我們會幫你建立待辦事項並生成相關學習內容。',
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
          title: '建立第一個待辦事項',
          description: '點擊這個按鈕開始建立你的第一個待辦事項！',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#hamburger-menu',
        popover: {
          title: '功能選單',
          description: '點擊這裡可以瀏覽所有功能：新手必備、單字庫等。',
          side: 'left',
          align: 'start'
        }
      },
      {
        popover: {
          title: '開始你的日文學習之旅！',
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

  const checkFirstVisit = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // 先檢查 localStorage 緩存
      const cachedStatus = localStorage.getItem('tourCompleted');
      if (cachedStatus === 'true') {
        return;
      }

      // 查詢 Firebase 是否有該用戶的導覽記錄
      const q = query(
        collection(db, 'tourCompletions'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 用戶已看過導覽，更新緩存
        localStorage.setItem('tourCompleted', 'true');
      } else {
        // 用戶未看過導覽，顯示導覽
        setTimeout(() => {
          startTour();
          // 記錄到 Firebase
          addDoc(collection(db, 'tourCompletions'), {
            userId,
            completedAt: new Date().toISOString()
          });
          localStorage.setItem('tourCompleted', 'true');
        }, 1500);
      }
    } catch (error) {
      console.error('檢查導覽狀態失敗:', error);
      // 發生錯誤時，檢查 localStorage
      const cachedStatus = localStorage.getItem('tourCompleted');
      if (cachedStatus !== 'true') {
        setTimeout(() => {
          startTour();
          localStorage.setItem('tourCompleted', 'true');
        }, 1500);
      }
    }
  };

  const resetTour = () => {
    localStorage.removeItem('tourCompleted');
    startTour();
  };

  return {
    startTour,
    checkFirstVisit,
    resetTour
  };
};
