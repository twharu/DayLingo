'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DeveloperTestPanelProps {
  userId: string | null;
  onTriggerPostSurvey: () => void;
  onResetAll: () => void;
}

export default function DeveloperTestPanel({ userId, onTriggerPostSurvey, onResetAll }: DeveloperTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 監聽 Ctrl+Shift+T 快捷鍵
  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 支援 Mac 的 Cmd 鍵 (metaKey) 和 Windows/Linux 的 Ctrl 鍵
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const simulateUsage = async (times: number) => {
    if (!userId) {
      alert('請先完成用戶註冊');
      return;
    }

    setLoading(true);
    try {
      // 創建模擬的學習會話
      const now = new Date();
      const promises = [];

      for (let i = 0; i < times; i++) {
        const sessionData = {
          userId: userId,
          date: now.toISOString().split('T')[0],
          wordsGenerated: 10,
          wordsSaved: 3
        };

        promises.push(addDoc(collection(db, 'learningSessions'), sessionData));
      }

      await Promise.all(promises);

      // 更新用戶使用次數
      const q = query(collection(db, 'users'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const currentData = userDoc.data();
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          usageCount: (currentData.usageCount || 0) + times,
          lastUsed: now.toISOString()
        });
      }

      alert(`成功模擬 ${times} 次使用記錄！`);
    } catch (error) {
      console.error('模擬使用失敗:', error);
      alert('模擬失敗');
    }
    setLoading(false);
  };

  const checkUsageCount = async () => {
    if (!userId) {
      alert('請先完成用戶註冊');
      return;
    }

    // 先檢查本地緩存
    const cachedCount = localStorage.getItem(`usageCount_${userId}`);
    const localCount = localStorage.getItem('localUsageCount') || '0';
    
    if (cachedCount) {
      alert(`當前使用次數: ${cachedCount} 次 (本地緩存)\n本地計數: ${localCount} 次`);
      return;
    }

    try {
      const q = query(collection(db, 'learningSessions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      // 緩存結果
      localStorage.setItem(`usageCount_${userId}`, querySnapshot.size.toString());
      
      alert(`當前使用次數: ${querySnapshot.size} 次 (Firebase)\n本地計數: ${localCount} 次`);
    } catch (error) {
      console.error('查詢使用次數失敗:', error);
      alert(`查詢失敗，使用本地計數: ${localCount} 次`);
    }
  };

  const cleanTestData = async () => {
    alert('此功能已停用：由於學習會話不再儲存任務資訊，無法區分測試資料和正式資料。請使用「清理重複記錄」功能來清理異常資料。');
  };

  const cleanDuplicateRecords = async () => {
    if (!confirm('確定要清理重複記錄嗎？這將刪除所有學習時間少於10秒的記錄。')) {
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'learningSessions'));
      const querySnapshot = await getDocs(q);

      const deletePromises: Promise<void>[] = [];
      let deleteCount = 0;
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // 刪除學習時間少於10秒的記錄（可能是重複觸發的）
        if (data.studyTimeSeconds && data.studyTimeSeconds < 10) {
          deletePromises.push(deleteDoc(docSnapshot.ref));
          deleteCount++;
        }
      });
      
      if (deleteCount === 0) {
        alert('沒有找到需要清理的重複記錄。');
        return;
      }
      
      await Promise.all(deletePromises);
      alert(`成功清理 ${deleteCount} 筆重複記錄！`);
      
    } catch (error) {
      console.error('清理重複記錄失敗:', error);
      alert('清理失敗，請檢查 Firebase 連線。');
    }
    setLoading(false);
  };

  const resetAllData = () => {
    if (confirm('確定要重置所有數據嗎？這將清除所有 localStorage 數據。')) {
      // 保存重要的配置
      const firebaseConfig = localStorage.getItem('firebase_quota_exceeded');
      
      localStorage.clear();
      
      // 恢復重要配置
      if (firebaseConfig) {
        localStorage.setItem('firebase_quota_exceeded', firebaseConfig);
      }
      
      onResetAll();
      alert('所有數據已重置！請重新整理頁面。');
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-red-600 text-white text-xs px-3 py-2 rounded opacity-75 hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
          title="點擊開啟開發者面板"
        >
          🧪 開發者面板
          <div className="text-xs opacity-75 mt-1">
            點擊開啟
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-red-500 p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-red-600">🧪 開發者測試面板</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="bg-gray-50 p-3 rounded">
          <strong>用戶ID:</strong> {userId || '未設定'}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">快速測試:</h4>
          
          <button
            onClick={() => simulateUsage(1)}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            模擬 1 次使用
          </button>

          <button
            onClick={() => simulateUsage(5)}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            模擬 5 次使用 (觸發後問卷)
          </button>

          <button
            onClick={checkUsageCount}
            className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
          >
            檢查當前使用次數
          </button>

          <button
            onClick={onTriggerPostSurvey}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
          >
            強制顯示後問卷
          </button>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-semibold text-red-600">危險操作:</h4>
          
          <button
            onClick={cleanTestData}
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50 mt-2"
          >
            清理測試資料
          </button>
          
          <button
            onClick={cleanDuplicateRecords}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50 mt-2"
          >
            清理重複記錄 (少於10秒)
          </button>
          
          <button
            onClick={resetAllData}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-2"
          >
            重置所有數據
          </button>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 提示: 按 Cmd+Shift+T (Mac) 或 Ctrl+Shift+T 開關此面板
        </div>
      </div>
    </div>
  );
}