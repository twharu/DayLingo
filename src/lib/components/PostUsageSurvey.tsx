'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PostUsageSurveyProps {
  onClose: () => void;
  userId: string;
}

export default function PostUsageSurvey({ onClose, userId }: PostUsageSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    overallSatisfaction: '',
    learningEffectiveness: '',
    vocabularyRetention: '',
    confidenceImprovement: '',
    dailyUsageHelp: '',
    recommendToOthers: '',
    mostHelpfulFeature: '',
    suggestions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      title: "整體滿意度",
      subtitle: "請評價您對這個日語學習APP的整體滿意度",
      type: "radio",
      key: "overallSatisfaction" as keyof typeof responses,
      options: [
        "非常滿意",
        "滿意", 
        "普通",
        "不滿意",
        "非常不滿意"
      ]
    },
    {
      title: "學習效果",
      subtitle: "使用這個APP後，您覺得日語學習效果如何？",
      type: "radio",
      key: "learningEffectiveness" as keyof typeof responses,
      options: [
        "顯著提升",
        "有所提升",
        "略有提升", 
        "沒有變化",
        "反而退步"
      ]
    },
    {
      title: "單字記憶",
      subtitle: "使用APP學習的單字，您能記住多少？",
      type: "radio",
      key: "vocabularyRetention" as keyof typeof responses,
      options: [
        "80%以上",
        "60-80%",
        "40-60%",
        "20-40%", 
        "20%以下"
      ]
    },
    {
      title: "信心提升",
      subtitle: "使用APP後，您在日常日語使用上是否更有信心？",
      type: "radio",
      key: "confidenceImprovement" as keyof typeof responses,
      options: [
        "信心大幅提升",
        "信心有所提升",
        "信心略有提升",
        "沒有變化",
        "信心下降"
      ]
    },
    {
      title: "日常幫助",
      subtitle: "這個APP對您在日本的日常生活有幫助嗎？",
      type: "radio", 
      key: "dailyUsageHelp" as keyof typeof responses,
      options: [
        "幫助很大",
        "有一定幫助",
        "略有幫助",
        "沒什麼幫助",
        "完全沒幫助"
      ]
    },
    {
      title: "推薦意願",
      subtitle: "您會推薦這個APP給其他剛來日本的朋友嗎？",
      type: "radio",
      key: "recommendToOthers" as keyof typeof responses,
      options: [
        "非常願意推薦",
        "願意推薦", 
        "可能會推薦",
        "不太會推薦",
        "絕對不推薦"
      ]
    },
    {
      title: "最有用功能",
      subtitle: "您認為APP中哪個功能對您最有幫助？",
      type: "radio",
      key: "mostHelpfulFeature" as keyof typeof responses,
      options: [
        "AI生成學習內容",
        "語音播放功能",
        "單字收藏功能",
        "例句展示功能"
      ]
    },
    {
      title: "改進建議",
      subtitle: "您有什麼建議能讓這個APP更好地幫助日語學習？（可選）",
      type: "textarea",
      key: "suggestions" as keyof typeof responses,
      placeholder: "請分享您的想法和建議..."
    }
  ];

  const handleOptionSelect = (key: keyof typeof responses, value: string) => {
    setResponses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'postUsageSurveys'), {
        userId,
        ...responses,
        submittedAt: serverTimestamp(),
        type: 'post-usage'
      });
      
      localStorage.setItem('postSurveyCompleted', 'true');
      setIsSubmitting(false); // 在關閉前先重置狀態
      onClose();
    } catch (error) {
      console.error('提交問卷失敗:', error);
      alert('提交失敗，請稍後再試');
      setIsSubmitting(false); // 發生錯誤時也要重置狀態
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = currentQuestion.type === 'textarea' || responses[currentQuestion.key];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">使用回饋問卷</h2>
              <p className="text-sm text-gray-500">步驟 {currentStep + 1} / {questions.length}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {currentQuestion.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {currentQuestion.subtitle}
            </p>

            {currentQuestion.type === 'radio' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <label key={index} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={currentQuestion.key}
                      value={option}
                      checked={responses[currentQuestion.key] === option}
                      onChange={() => handleOptionSelect(currentQuestion.key, option)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'textarea' && (
              <textarea
                value={responses[currentQuestion.key]}
                onChange={(e) => handleOptionSelect(currentQuestion.key, e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
              />
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一步
            </button>
            
            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '提交問卷'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}