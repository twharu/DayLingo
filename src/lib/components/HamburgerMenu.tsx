'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HamburgerMenuProps {
  currentPath?: string;
  onClearContent?: () => void;
  hasContent?: boolean;
}

export default function HamburgerMenu({ currentPath, onClearContent, hasContent }: HamburgerMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState('');

  // 載入使用者資訊
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || '使用者');
      setUserPhotoURL(localStorage.getItem('userPhotoURL') || '');
    }
  }, []);

  // 根據時間取得問候語
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはよう！早安';
    if (hour < 18) return 'こんにちは！午安';
    return 'こんばんは！晚安';
  };

  return (
    <>
      {/* 漢堡選單按鈕 */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="開啟選單"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 側邊滑出選單 */}
      {isMenuOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* 滑出選單 */}
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            {/* 選單標題 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">選單</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="關閉選單"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 使用者資訊區塊 */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center space-x-4">
                {/* 使用者頭像 */}
                <div className="flex-shrink-0">
                  {userPhotoURL ? (
                    <img
                      src={userPhotoURL}
                      alt="使用者頭像"
                      className="w-14 h-14 rounded-full border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-md">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* 問候語和使用者名稱 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">{getGreeting()}</p>
                  <p className="text-lg font-bold text-gray-800 truncate">{userName}！</p>
                </div>
              </div>
            </div>

            {/* 選單項目 */}
            <nav className="p-6 space-y-4">
              <Link 
                href="/"
                className="block p-4 rounded-lg transition-all duration-200 hover:bg-blue-50 relative group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative">
                  <h3 className="font-medium text-gray-800">首頁</h3>
                </div>
              </Link>
              
              <Link 
                href="/essential-words"
                className="block p-4 rounded-lg transition-all duration-200 hover:bg-purple-50 relative group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="absolute inset-0 bg-purple-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative">
                  <h3 className="font-medium text-gray-800">新手必備</h3>
                </div>
              </Link>
              
              <Link
                href="/vocabulary"
                className="block p-4 rounded-lg transition-all duration-200 hover:bg-green-50 relative group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative">
                  <h3 className="font-medium text-gray-800">單字庫</h3>
                </div>
              </Link>

              <Link 
                id="settings-link"
                href="/settings"
                className="block p-4 rounded-lg transition-all duration-200 hover:bg-gray-50 relative group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative">
                  <h3 className="font-medium text-gray-800">設定</h3>
                  <p className="text-sm text-gray-500">Email 提醒設定</p>
                </div>
              </Link>
              
              {hasContent && onClearContent && (
                <button
                  onClick={() => {
                    onClearContent();
                    setIsMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-lg transition-all duration-200 hover:bg-gray-50 relative group text-left"
                >
                  <div className="absolute inset-0 bg-gray-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    <h3 className="font-medium text-gray-800">重新開始</h3>
                    <p className="text-sm text-gray-500">清除目前內容</p>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}