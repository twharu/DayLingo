'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SurveyModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  isManualTrigger?: boolean; // 新增屬性來標記是否為手動觸發
}

interface SurveyData {
  age: string;
  timeInJapan: string;
  identity: string;
  otherIdentity: string;
  japaneseLevelBefore: string;
  japaneseLevelCurrent: string;
  // 新增第二部分問題
  difficulties: string[];
  situationDifficulties: string[];
  // 新增第三部分問題
  desiredJapanese: string[];
  currentLearningMethods: string[];
  learningProblems: string[];
  appInterest: string;
  // 其他選項的詳細說明
  otherDifficulty: string;
  otherSituation: string;
  otherDesired: string;
  otherLearningMethod: string;
}

export default function SurveyModal({ isOpen, onComplete, onClose, isManualTrigger = false }: SurveyModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    age: '',
    timeInJapan: '',
    identity: '',
    otherIdentity: '',
    japaneseLevelBefore: '',
    japaneseLevelCurrent: '',
    difficulties: [],
    situationDifficulties: [],
    desiredJapanese: [],
    currentLearningMethods: [],
    learningProblems: [],
    appInterest: '',
    otherDifficulty: '',
    otherSituation: '',
    otherDesired: '',
    otherLearningMethod: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 處理複選框的選擇
  const handleCheckboxChange = (field: 'difficulties' | 'situationDifficulties' | 'desiredJapanese' | 'currentLearningMethods' | 'learningProblems', value: string) => {
    setSurveyData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const checkIncompleteQuestions = () => {
    // 檢查第一步
    if (surveyData.age.trim() === '' || 
        surveyData.timeInJapan.trim() === '' || 
        surveyData.identity === '' || 
        (surveyData.identity === '其他' && surveyData.otherIdentity.trim() === '') ||
        surveyData.japaneseLevelBefore === '' || 
        surveyData.japaneseLevelCurrent === '') {
      return 0;
    }
    
    // 檢查第二步
    if (surveyData.difficulties.length === 0 || 
        (surveyData.difficulties.includes('其他') && surveyData.otherDifficulty.trim() === '') ||
        surveyData.situationDifficulties.length === 0 || 
        (surveyData.situationDifficulties.includes('其他') && surveyData.otherSituation.trim() === '')) {
      return 1;
    }
    
    // 檢查第三步
    if (surveyData.desiredJapanese.length === 0 || 
        (surveyData.desiredJapanese.includes('其他') && surveyData.otherDesired.trim() === '') ||
        surveyData.currentLearningMethods.length === 0 || 
        (surveyData.currentLearningMethods.includes('其他') && surveyData.otherLearningMethod.trim() === '') ||
        surveyData.learningProblems.length === 0 ||
        surveyData.appInterest === '') {
      return 2;
    }
    
    return -1; // 所有問題都已完成
  };

  const handleSubmit = async () => {
    // 檢查是否有未完成的問題
    const incompleteStep = checkIncompleteQuestions();

    if (incompleteStep !== -1) {
      // 跳轉到未完成的問題
      setCurrentStep(incompleteStep);
      alert('請完成所有必填問題後再提交問卷');
      return;
    }

    setIsSubmitting(true);
    try {
      // 使用已登入的 Google userId
      const userId = localStorage.getItem('userId');

      if (!userId) {
        alert('無法獲取用戶資訊，請重新登入');
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'surveyResponses'), {
        userId,
        responses: surveyData,
        timestamp: new Date().toISOString(),
        version: '1.0',
        isManualSubmission: isManualTrigger // 記錄是否為手動提交
      });

      // 只有在首次填寫時才設定 surveyCompleted 標記
      if (!isManualTrigger) {
        localStorage.setItem('surveyCompleted', 'true');
      }

      setIsSubmitting(false); // 在調用 onComplete 前先重置狀態
      onComplete();
      // 問卷完成後不跳轉，留在當前頁面
    } catch (error) {
      console.error('提交問卷失敗:', error);
      alert('提交失敗，請重試');
      setIsSubmitting(false); // 發生錯誤時也要重置狀態
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    // 關閉問卷時不跳轉，留在當前頁面
  };

  const steps = [
    {
      title: '基本資料與日語程度',
      component: (
        <div className="space-y-8">
          {/* 基本資料區域 */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">基本資料</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  請問您的年齡是？ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例：25"
                  value={surveyData.age}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  請問您來日本多久了？ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例：3個月"
                  value={surveyData.timeInJapan}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, timeInJapan: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  請問您目前的身分是？ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    '語言學校學生',
                    '專門學校學生', 
                    '大學生（學部）',
                    '大學院生（修士/博士）',
                    '研究生',
                    '交換學生',
                    '其他'
                  ].map(identity => (
                    <button
                      key={identity}
                      type="button"
                      onClick={() => setSurveyData(prev => ({ ...prev, identity }))}
                      className={`w-full p-2 rounded-lg border-2 text-left transition-colors text-sm ${
                        surveyData.identity === identity
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-800'
                      }`}
                    >
                      {identity}
                    </button>
                  ))}
                </div>
                {surveyData.identity === '其他' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={surveyData.otherIdentity}
                      onChange={(e) => setSurveyData(prev => ({ ...prev, otherIdentity: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        surveyData.otherIdentity.trim() === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {surveyData.otherIdentity.trim() === '' && (
                      <p className="text-red-600 text-xs mt-1">
                        ※ 請填寫具體說明才能繼續
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 日語程度區域 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">日語程度</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  您來日本前的日語程度大約是？ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    '完全零基礎',
                    '會五十音，單字量很少，例：知道「あ、か、さ」的讀音，會幾個單字如「さくら」',
                    'N5程度／基礎會話，例：會基本問候「おはよう」，能簡單自我介紹',
                    'N4程度／簡單日常對話，例：能說「今日は寒いですね」「電話番号を教えてください」',
                    'N3程度／一般日常對話，例：能討論興趣、表達意見，理解日常生活大部分對話',
                    'N2程度以上，例：能閱讀新聞，進行較深入的對話'
                  ].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSurveyData(prev => ({ ...prev, japaneseLevelBefore: level }))}
                      className={`w-full p-2 rounded-lg border-2 text-left transition-colors text-sm ${
                        surveyData.japaneseLevelBefore === level
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-800'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  您目前的日語程度？ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    '努力學習五十音，例：看到「こんにちは」需要想一下才知道讀音',
                    '能進行最基本的日語對話，例：會說「ありがとう」「すみません」，能簡單自我介紹',
                    'N5程度／基礎會話，例：能說「コンビニはどこですか」「これはいくらですか」等簡單句子',
                    'N4程度／簡單日常對話，例：能用過去式說「昨日映画を見ました」，會用「...したい」表達想要',
                    'N3程度／一般日常對話，例：能說「電車が遅れているので、遅くなります」等稍複雜的句子',
                    'N2程度以上，例：能理解新聞內容，進行工作或學業相關的深度對話'
                  ].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSurveyData(prev => ({ ...prev, japaneseLevelCurrent: level }))}
                      className={`w-full p-2 rounded-lg border-2 text-left transition-colors text-sm ${
                        surveyData.japaneseLevelCurrent === level
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-800'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm">
              * 表示必填問題
            </p>
          </div>
        </div>
      )
    },
    {
      title: '在日生活相關',
      component: (
        <div className="space-y-8">
          {/* 第一題：使用日語時最大困擾 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-4">
              您在實際使用日語時最大的困擾是？ (可複選) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                '聽不懂對方在說什麼',
                '想表達但不知道怎麼說',
                '語速太快跟不上',
                '漢字讀音不會',
                '方言或俗語聽不懂',
                '其他'
              ].map(option => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`difficulty-${option}`}
                    checked={surveyData.difficulties.includes(option)}
                    onChange={() => handleCheckboxChange('difficulties', option)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`difficulty-${option}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {surveyData.difficulties.includes('其他') && (
              <div className="mt-2">
                <input
                  type="text"
                  value={surveyData.otherDifficulty}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, otherDifficulty: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    surveyData.otherDifficulty.trim() === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {surveyData.otherDifficulty.trim() === '' && (
                  <p className="text-red-600 text-xs mt-1">
                    ※ 請填寫具體說明
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 第二題：什麼情境下容易有日語使用困擾 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-4">
              您在什麼情境下容易有日語使用的困擾？ (最多選3項) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                '在便利商店、超市購物',
                '辦理手機、銀行、區役所等手續',
                '與房屋管理公司或租屋管理員溝通',
                '看病就醫時的對話',
                '在餐廳點餐',
                '問路或搭乘交通工具',
                '與同學、老師的學校對話',
                '其他'
              ].map(option => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`situation-${option}`}
                    checked={surveyData.situationDifficulties.includes(option)}
                    onChange={() => handleCheckboxChange('situationDifficulties', option)}
                    disabled={surveyData.situationDifficulties.length >= 3 && !surveyData.situationDifficulties.includes(option)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label htmlFor={`situation-${option}`} className={`ml-3 text-sm ${
                    surveyData.situationDifficulties.length >= 3 && !surveyData.situationDifficulties.includes(option)
                      ? 'text-gray-400' 
                      : 'text-gray-700'
                  }`}>
                    {option}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-blue-600 mt-2">
              已選擇 {surveyData.situationDifficulties.length}/3 項
            </p>
            {surveyData.situationDifficulties.includes('其他') && (
              <div className="mt-2">
                <input
                  type="text"
                  value={surveyData.otherSituation}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, otherSituation: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    surveyData.otherSituation.trim() === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {surveyData.otherSituation.trim() === '' && (
                  <p className="text-red-600 text-xs mt-1">
                    ※ 請填寫具體說明
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm">
              * 表示必填問題
            </p>
          </div>
        </div>
      )
    },
    {
      title: '目前學習方式',
      component: (
        <div className="space-y-8">
          {/* 第一題：希望快速學會哪些情境的日語 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-4">
              您最希望快速學會哪些情境的日語？ (可複選) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                '便利商店、超市購物用語',
                '銀行、郵局、區役所手續用語',
                '租房、宿舍相關用語',
                '醫院看病用語',
                '餐廳點餐用語',
                '交通工具使用用語',
                '學校生活用語',
                '其他'
              ].map(option => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`desired-${option}`}
                    checked={surveyData.desiredJapanese.includes(option)}
                    onChange={() => handleCheckboxChange('desiredJapanese', option)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`desired-${option}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {surveyData.desiredJapanese.includes('其他') && (
              <div className="mt-2">
                <input
                  type="text"
                  value={surveyData.otherDesired}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, otherDesired: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    surveyData.otherDesired.trim() === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {surveyData.otherDesired.trim() === '' && (
                  <p className="text-red-600 text-xs mt-1">
                    ※ 請填寫具體說明
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 第二題：目前如何學習日語 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-4">
              您目前如何學習日語？ (可複選) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                '語言學校課程',
                '大學的日語課',
                '線上課程/App',
                '與日本朋友練習',
                '看日劇/動漫學習',
                '自己買教材學習',
                '語言交換',
                '幾乎沒有特別學習',
                '其他'
              ].map(option => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`learning-${option}`}
                    checked={surveyData.currentLearningMethods.includes(option)}
                    onChange={() => handleCheckboxChange('currentLearningMethods', option)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`learning-${option}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {surveyData.currentLearningMethods.includes('其他') && (
              <div className="mt-2">
                <input
                  type="text"
                  value={surveyData.otherLearningMethod}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, otherLearningMethod: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    surveyData.otherLearningMethod.trim() === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {surveyData.otherLearningMethod.trim() === '' && (
                  <p className="text-red-600 text-xs mt-1">
                    ※ 請填寫具體說明
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 第三題：覺得現有學習方式有什麼問題 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-4">
              您覺得現有學習方式有什麼問題嗎？ (可複選) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                '學的內容與實際生活脫節',
                '進度太慢，無法應付日常需求',
                '缺乏實際對話練習機會',
                '不知道學到的東西何時能用上',
                '沒有針對留學生活的專門內容',
                '學習時間不夠',
                '沒有明顯問題'
              ].map(option => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`problem-${option}`}
                    checked={surveyData.learningProblems.includes(option)}
                    onChange={() => handleCheckboxChange('learningProblems', option)}
                    disabled={
                      (option === '沒有明顯問題' && surveyData.learningProblems.some(p => p !== '沒有明顯問題')) ||
                      (option !== '沒有明顯問題' && surveyData.learningProblems.includes('沒有明顯問題'))
                    }
                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                      ((option === '沒有明顯問題' && surveyData.learningProblems.some(p => p !== '沒有明顯問題')) ||
                       (option !== '沒有明顯問題' && surveyData.learningProblems.includes('沒有明顯問題'))) 
                        ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <label 
                    htmlFor={`problem-${option}`} 
                    className={`ml-3 text-sm ${
                      ((option === '沒有明顯問題' && surveyData.learningProblems.some(p => p !== '沒有明顯問題')) ||
                       (option !== '沒有明顯問題' && surveyData.learningProblems.includes('沒有明顯問題'))) 
                        ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {surveyData.learningProblems.includes('沒有明顯問題') && (
              <p className="text-xs text-amber-600 mt-2">
                ※ 已選擇「沒有明顯問題」，無法選擇其他選項
              </p>
            )}
          </div>

          {/* 第四題：APP興趣度 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-4">
              如果有一個APP可以根據您的日常待辦事項（如購物、辦手續）自動生成相關日語學習內容，您會有興趣嗎？ <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                '非常有興趣，立刻想試用',
                '有興趣，會考慮使用',
                '可能有興趣，看使用效果',
                '興趣不大，已有其他學習方式',
                '完全沒興趣'
              ].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSurveyData(prev => ({ ...prev, appInterest: option }))}
                  className={`w-full p-2 rounded-lg border-2 text-left transition-colors text-sm ${
                    surveyData.appInterest === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-800'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm">
              * 表示必填問題
            </p>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  const isCurrentStepValid = () => {
    if (currentStep === 0) {
      return surveyData.age.trim() !== '' && 
             surveyData.timeInJapan.trim() !== '' && 
             surveyData.identity !== '' && 
             (surveyData.identity !== '其他' || surveyData.otherIdentity.trim() !== '') &&
             surveyData.japaneseLevelBefore !== '' && 
             surveyData.japaneseLevelCurrent !== '';
    } else if (currentStep === 1) {
      const difficultiesValid = surveyData.difficulties.length > 0 && 
        (!surveyData.difficulties.includes('其他') || surveyData.otherDifficulty.trim() !== '');
      const situationValid = surveyData.situationDifficulties.length > 0 && 
        (!surveyData.situationDifficulties.includes('其他') || surveyData.otherSituation.trim() !== '');
      return difficultiesValid && situationValid;
    } else if (currentStep === 2) {
      const desiredValid = surveyData.desiredJapanese.length > 0 && 
        (!surveyData.desiredJapanese.includes('其他') || surveyData.otherDesired.trim() !== '');
      const learningMethodValid = surveyData.currentLearningMethods.length > 0 && 
        (!surveyData.currentLearningMethods.includes('其他') || surveyData.otherLearningMethod.trim() !== '');
      const learningProblemsValid = surveyData.learningProblems.length > 0;
      
      return desiredValid && learningMethodValid && learningProblemsValid &&
             surveyData.appInterest !== '';
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">日文學習App事前問卷調查</h2>
          <p className="text-gray-700 mt-3">
            您好！我是就讀神戶情報大學院大學二年級的學生，我正在開發一款專為台灣留學生設計的日語學習App，透過AI推薦與您今日待辦事項有關的日文詞彙。您的經驗分享將幫助我完成研究論文！問卷約需3分鐘，感謝您的參與！
          </p>
          <div className="flex items-center mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
            </div>
            <span className="ml-4 text-sm text-gray-700 whitespace-nowrap">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {steps[currentStep].title}
          </h3>
          {steps[currentStep].component}
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            上一步
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isCurrentStepValid()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentStepValid() || isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? '提交中...' : '完成問卷'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
