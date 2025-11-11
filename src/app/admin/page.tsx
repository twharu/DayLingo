'use client';

import { useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import BackButton from '@/lib/components/BackButton';

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
  wordsGenerated: number;
  wordsSaved: number;
}

interface ReportedContribution {
  contributionId: string;
  contribution: {
    id: string;
    category: string;
    type: string;
    content: Record<string, unknown>;
    reportCount: number;
  };
  reports: Array<{
    id: string;
    reportedBy: string;
    reason: string;
    reportedAt: any;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportedData, setReportedData] = useState<ReportedContribution[]>([]);
  const [showReports, setShowReports] = useState(false);

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

  const loadReportedContributions = async () => {
    setLoading(true);
    try {
      // 載入所有被檢舉的內容
      const contributionsSnapshot = await getDocs(
        query(collection(db, 'communityContributions'), where('reportCount', '>', 0))
      );

      const reported: ReportedContribution[] = [];

      for (const contributionDoc of contributionsSnapshot.docs) {
        const contribution = { id: contributionDoc.id, ...contributionDoc.data() };

        // 載入該內容的所有檢舉記錄
        const reportsSnapshot = await getDocs(
          query(collection(db, 'reports'), where('contributionId', '==', contributionDoc.id))
        );

        const reports = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        reported.push({
          contributionId: contributionDoc.id,
          contribution: contribution as any,
          reports: reports as any
        });
      }

      setReportedData(reported);
      setShowReports(true);
    } catch (error) {
      console.error('載入檢舉數據失敗:', error);
      alert('載入失敗');
    }
    setLoading(false);
  };

  const handleDeleteContribution = async (contributionId: string) => {
    if (!confirm('確定要刪除這個內容嗎？')) return;

    try {
      await deleteDoc(doc(db, 'communityContributions', contributionId));
      // 刪除相關的檢舉記錄
      const reportsSnapshot = await getDocs(
        query(collection(db, 'reports'), where('contributionId', '==', contributionId))
      );
      for (const reportDoc of reportsSnapshot.docs) {
        await deleteDoc(doc(db, 'reports', reportDoc.id));
      }
      alert('已刪除');
      loadReportedContributions();
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗');
    }
  };

  const handleIgnoreReports = async (contributionId: string) => {
    if (!confirm('確定要忽略這些檢舉嗎？這將清除檢舉計數。')) return;

    try {
      await updateDoc(doc(db, 'communityContributions', contributionId), {
        reportCount: 0
      });
      // 刪除檢舉記錄
      const reportsSnapshot = await getDocs(
        query(collection(db, 'reports'), where('contributionId', '==', contributionId))
      );
      for (const reportDoc of reportsSnapshot.docs) {
        await deleteDoc(doc(db, 'reports', reportDoc.id));
      }
      alert('已忽略檢舉');
      loadReportedContributions();
    } catch (error) {
      console.error('操作失敗:', error);
      alert('操作失敗');
    }
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
      'ID', 'UserID', 'Date', 'WordsGenerated', 'WordsSaved'
    ];

    const rows = data.map(item => [
      item.id,
      item.userId,
      item.date,
      item.wordsGenerated.toString(),
      item.wordsSaved.toString()
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
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800 flex-1 text-center">數據管理中心</h1>
            <div className="w-20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                匯出使用時間、學習待辦事項、詞彙使用等行為數據
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

            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-4">檢舉管理</h3>
              <p className="text-red-600 mb-4 text-sm">
                查看和處理使用者檢舉的社群貢獻內容
              </p>
              <button
                onClick={loadReportedContributions}
                disabled={loading}
                className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '載入中...' : '查看檢舉'}
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

          {/* 檢舉管理區域 */}
          {showReports && (
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">檢舉內容列表</h3>
                <button
                  onClick={() => setShowReports(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  關閉
                </button>
              </div>

              {reportedData.length === 0 ? (
                <p className="text-center text-gray-600 py-8">目前沒有被檢舉的內容</p>
              ) : (
                <div className="space-y-4">
                  {reportedData.map((item) => (
                    <div key={item.contributionId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              檢舉 {item.contribution.reportCount} 次
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              {item.contribution.category}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                              {item.contribution.type === 'tip' ? '提示' : item.contribution.type === 'word' ? '單字' : '句型'}
                            </span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            {item.contribution.type === 'tip' && (
                              <p className="text-gray-800">{item.contribution.content.tip as string}</p>
                            )}
                            {item.contribution.type === 'word' && (
                              <div>
                                <p className="font-bold text-gray-800">{item.contribution.content.word as string}</p>
                                <p className="text-blue-600">{item.contribution.content.reading as string}</p>
                                <p className="text-gray-700">{item.contribution.content.meaning as string}</p>
                              </div>
                            )}
                            {item.contribution.type === 'phrase' && (
                              <div>
                                <p className="text-gray-800 mb-1">{item.contribution.content.phrase as string}</p>
                                <p className="text-gray-600 text-sm">{item.contribution.content.translation as string}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleDeleteContribution(item.contributionId)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          刪除內容
                        </button>
                        <button
                          onClick={() => handleIgnoreReports(item.contributionId)}
                          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                          忽略檢舉
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}