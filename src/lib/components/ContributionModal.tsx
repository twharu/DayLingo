'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  type: 'tip' | 'word' | 'phrase';
  onSuccess?: () => void;
}

export default function ContributionModal({ isOpen, onClose, category, type, onSuccess }: ContributionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tip: '',
    word: '',
    reading: '',
    meaning: '',
    phrase: '',
    translation: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('請先登入');
        return;
      }

      let content = {};

      // 根據類型準備不同的內容
      if (type === 'tip') {
        content = { tip: formData.tip };
      } else if (type === 'word') {
        content = {
          word: formData.word,
          reading: formData.reading,
          meaning: formData.meaning
        };
      } else if (type === 'phrase') {
        content = {
          phrase: formData.phrase,
          translation: formData.translation
        };
      }

      // 檢查是否有重複內容
      const isDuplicate = await checkDuplicate(content);
      if (isDuplicate) {
        alert('此內容已存在，請勿重複新增。');
        setLoading(false);
        return;
      }

      // 儲存到 Firebase
      await addDoc(collection(db, 'communityContributions'), {
        userId,
        category,
        type,
        content,
        reportCount: 0,
        isHidden: false,
        createdAt: serverTimestamp()
      });

      alert('感謝分享！內容已送出，等待其他使用者確認。');

      // 清空表單
      setFormData({
        tip: '',
        word: '',
        reading: '',
        meaning: '',
        phrase: '',
        translation: ''
      });

      // 通知父組件重新載入資料
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('提交失敗:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 檢查是否有重複內容
  const checkDuplicate = async (content: Record<string, unknown>): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'communityContributions'),
        where('category', '==', category),
        where('type', '==', type),
        where('isHidden', '==', false)
      );

      const querySnapshot = await getDocs(q);

      // 檢查是否有相同內容
      for (const doc of querySnapshot.docs) {
        const existingContent = doc.data().content;

        if (type === 'tip') {
          // 檢查提示是否相同（忽略大小寫和空白）
          const normalizedNew = (content.tip as string || '').trim().toLowerCase();
          const normalizedExisting = (existingContent.tip || '').trim().toLowerCase();
          if (normalizedNew === normalizedExisting) {
            return true;
          }
        } else if (type === 'word') {
          // 檢查單字是否相同
          if (content.word === existingContent.word) {
            return true;
          }
        } else if (type === 'phrase') {
          // 檢查句型是否相同（忽略大小寫和空白）
          const normalizedNew = (content.phrase as string || '').trim().toLowerCase();
          const normalizedExisting = (existingContent.phrase || '').trim().toLowerCase();
          if (normalizedNew === normalizedExisting) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('檢查重複失敗:', error);
      return false; // 如果檢查失敗，允許送出
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'tip':
        return '補充實用提示';
      case 'word':
        return '補充常用單字';
      case 'phrase':
        return '補充實用句型';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{getTitle()}</h3>
            <p className="text-sm text-gray-600 mt-1">分類：{category}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'tip' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                實用提示內容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.tip}
                onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="例如：需攜帶國民健康保險證，有國民健康保險，自付額只需30%"
                required
              />
            </div>
          )}

          {type === 'word' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日文單字 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：薬"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  讀音（平假名） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.reading}
                  onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：くすり"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  中文意思 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：藥"
                  required
                />
              </div>
            </>
          )}

          {type === 'phrase' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日文句子 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.phrase}
                  onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="例如：具合が悪いです"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  中文翻譯 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：我身體不舒服"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '送出中...' : '送出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
