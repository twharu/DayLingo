'use client';

import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface SurveyResponse {
  id: string;
  userId: string;
  responses: Record<string, unknown>;
  timestamp: string;
  version: string;
  isManualSubmission?: boolean;
}

interface LearningSession {
  id: string;
  userId: string;
  date: string;
  time: string;
  category: string;
  taskName: string;
  wordsGenerated: number;
  wordsSaved: number;
  studyTimeSeconds: number;
  voiceUsageCount: number;
  contentGeneratedAt: string;
  sessionEndAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = () => {
    // 簡單的密碼驗證（你可以改成你想要的密碼）
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('密碼錯誤');
    }
  };

  const exportSurveyData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'surveyResponses'));
      const data: SurveyResponse[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as SurveyResponse);
      });

      // 轉換為 CSV 格式
      const csvContent = convertSurveyToCSV(data);
      downloadCSV(csvContent, 'survey_responses.csv');
    } catch (error) {
      console.error('匯出問卷數據失敗:', error);
      alert('匯出失敗');
    }
    setLoading(false);
  };

  const exportSessionData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'learningSessions'));
      const data: LearningSession[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as LearningSession);
      });

      // 轉換為 CSV 格式
      const csvContent = convertSessionToCSV(data);
      downloadCSV(csvContent, 'learning_sessions.csv');
    } catch (error) {
      console.error('匯出學習會話數據失敗:', error);
      alert('匯出失敗');
    }
    setLoading(false);
  };

  const exportPostSurveyData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'postUsageSurveys'));
      const data: Array<Record<string, unknown>> = [];
      
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 轉換為 CSV 格式
      const csvContent = convertPostSurveyToCSV(data);
      downloadCSV(csvContent, 'post_usage_surveys.csv');
    } catch (error) {
      console.error('匯出後問卷數據失敗:', error);
      alert('匯出失敗');
    }
    setLoading(false);
  };

  const convertSurveyToCSV = (data: SurveyResponse[]): string => {
    const headers = [
      'ID', 'UserID', 'Timestamp', 'Age', 'TimeInJapan', 'Identity', 'OtherIdentity',
      'JapaneseLevelBefore', 'JapaneseLevelCurrent', 'Difficulties', 'SituationDifficulties',
      'DesiredJapanese', 'CurrentLearningMethods', 'LearningProblems', 'AppInterest',
      'OtherDifficulty', 'OtherSituation', 'OtherDesired', 'OtherLearningMethod', 'IsManual'
    ];
    
    const rows = data.map(item => [
      item.id,
      item.userId,
      item.timestamp,
      item.responses.age || '',
      item.responses.timeInJapan || '',
      item.responses.identity || '',
      item.responses.otherIdentity || '',
      item.responses.japaneseLevelBefore || '',
      item.responses.japaneseLevelCurrent || '',
      Array.isArray(item.responses.difficulties) ? item.responses.difficulties.join(';') : '',
      Array.isArray(item.responses.situationDifficulties) ? item.responses.situationDifficulties.join(';') : '',
      Array.isArray(item.responses.desiredJapanese) ? item.responses.desiredJapanese.join(';') : '',
      Array.isArray(item.responses.currentLearningMethods) ? item.responses.currentLearningMethods.join(';') : '',
      Array.isArray(item.responses.learningProblems) ? item.responses.learningProblems.join(';') : '',
      item.responses.appInterest || '',
      item.responses.otherDifficulty || '',
      item.responses.otherSituation || '',
      item.responses.otherDesired || '',
      item.responses.otherLearningMethod || '',
      item.isManualSubmission ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const convertSessionToCSV = (data: LearningSession[]): string => {
    const headers = [
      'ID', 'UserID', 'Date', 'Time', 'Category', 'TaskName', 
      'WordsGenerated', 'WordsSaved', 'StudyTimeSeconds', 'VoiceUsageCount',
      'ContentGeneratedAt', 'SessionEndAt'
    ];
    
    const rows = data.map(item => [
      item.id,
      item.userId,
      item.date,
      item.time,
      item.category,
      item.taskName,
      item.wordsGenerated.toString(),
      item.wordsSaved.toString(),
      item.studyTimeSeconds.toString(),
      item.voiceUsageCount.toString(),
      item.contentGeneratedAt,
      item.sessionEndAt
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const convertPostSurveyToCSV = (data: Array<Record<string, unknown>>): string => {
    const headers = [
      'ID', 'UserID', 'SubmittedAt', 'OverallSatisfaction', 'LearningEffectiveness',
      'VocabularyRetention', 'ConfidenceImprovement', 'DailyUsageHelp', 'RecommendToOthers',
      'MostHelpfulFeature', 'Suggestions'
    ];
    
    const rows = data.map(item => [
      item.id,
      item.userId,
      item.submittedAt,
      item.overallSatisfaction || '',
      item.learningEffectiveness || '',
      item.vocabularyRetention || '',
      item.confidenceImprovement || '',
      item.dailyUsageHelp || '',
      item.recommendToOthers || '',
      item.mostHelpfulFeature || '',
      item.suggestions || ''
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">管理員登入</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              登入
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">數據管理中心</h1>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              返回首頁
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">事前問卷數據</h3>
              <p className="text-blue-600 mb-4 text-sm">
                匯出用戶基本資料、學習背景、需求分析等數據
              </p>
              <button
                onClick={exportSurveyData}
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '匯出中...' : '匯出事前問卷'}
              </button>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4">學習會話數據</h3>
              <p className="text-green-600 mb-4 text-sm">
                匯出使用時間、學習任務、詞彙使用等行為數據
              </p>
              <button
                onClick={exportSessionData}
                disabled={loading}
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '匯出中...' : '匯出學習數據'}
              </button>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">事後問卷數據</h3>
              <p className="text-purple-600 mb-4 text-sm">
                匯出使用滿意度、學習效果、改進建議等回饋數據
              </p>
              <button
                onClick={exportPostSurveyData}
                disabled={loading}
                className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? '匯出中...' : '匯出事後問卷'}
              </button>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">使用說明</h3>
            <ul className="text-yellow-700 space-y-2 text-sm">
              <li>• 點擊按鈕會下載 CSV 文件，可用 Excel 或 Google Sheets 開啟</li>
              <li>• 多選題以分號(;)分隔</li>
              <li>• 建議定期備份數據</li>
              <li>• CSV 文件支援中文字符</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}