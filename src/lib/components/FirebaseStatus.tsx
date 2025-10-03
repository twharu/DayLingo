'use client';

import { useState, useEffect } from 'react';

export default function FirebaseStatus() {
  const [status, setStatus] = useState<'online' | 'quota-exceeded' | 'offline'>('online');

  useEffect(() => {
    // 檢查是否有配額超過的記錄
    const quotaError = localStorage.getItem('firebase_quota_exceeded');
    if (quotaError) {
      setStatus('quota-exceeded');
    }

    // 監聽全局的 Firebase 錯誤
    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent<{ code: string }>;
      if (customEvent.detail && customEvent.detail.code === 'resource-exhausted') {
        setStatus('quota-exceeded');
        localStorage.setItem('firebase_quota_exceeded', 'true');
      }
    };

    window.addEventListener('firebase-error', handleError);
    return () => window.removeEventListener('firebase-error', handleError);
  }, []);

  if (status === 'quota-exceeded') {
    return (
      <div className="fixed top-4 left-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
        <div className="flex">
          <div className="py-1">
            <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
            </svg>
          </div>
          <div>
            <p className="font-bold">Firebase 配額已用完</p>
            <p className="text-sm">正在使用本地備援機制，功能仍可正常使用。</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}