'use client';

import { useState } from 'react';

interface AIAnalysisButtonProps {
  memoId: string;
  onAnalysisComplete?: (result: {
    id: string;
    memoId: string;
    type: string;
    content: string;
    applied: boolean;
    createdAt: string;
  }) => void;
}

const analysisTypes = [
  {
    id: 'grammar',
    name: '문법 검토',
    description: '문법과 맞춤법을 검토하고 개선 제안',
    icon: '📝',
  },
  {
    id: 'style',
    name: '문체 개선',
    description: '더 명확하고 효과적인 표현으로 개선',
    icon: '✨',
  },
  {
    id: 'structure',
    name: '구조 분석',
    description: '논리적이고 체계적인 구조로 개선',
    icon: '🏗️',
  },
  {
    id: 'summary',
    name: '요약 생성',
    description: '핵심 포인트를 추출하여 요약',
    icon: '📋',
  },
];

export default function AIAnalysisButton({
  memoId,
  onAnalysisComplete,
}: AIAnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAnalysis = async (type: string) => {
    try {
      setAnalyzing(type);
      setError('');

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoId,
          type,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onAnalysisComplete?.(result);
        setIsOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '분석 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI 분석 오류:', error);
      setError('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
      >
        <span>🤖</span>
        <span>AI 분석</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AI 분석 옵션
            </h3>

            <div className="space-y-3">
              {analysisTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleAnalysis(type.id)}
                  disabled={analyzing !== null}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {type.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {type.description}
                      </div>
                    </div>
                    {analyzing === type.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-gray-500 hover:text-gray-700 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
