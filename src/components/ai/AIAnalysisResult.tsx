'use client';

interface AIAnalysisResultProps {
  result: {
    type: string;
    content: string;
    createdAt: string;
  };
  onClose?: () => void;
}

const analysisTypeLabels = {
  grammar: '문법 검토',
  style: '문체 개선',
  structure: '구조 분석',
  summary: '요약 생성',
};

const analysisTypeIcons = {
  grammar: '📝',
  style: '✨',
  structure: '🏗️',
  summary: '📋',
};

export default function AIAnalysisResult({
  result,
  onClose,
}: AIAnalysisResultProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">
            {analysisTypeIcons[result.type as keyof typeof analysisTypeIcons]}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {
                analysisTypeLabels[
                  result.type as keyof typeof analysisTypeLabels
                ]
              }
            </h3>
            <p className="text-sm text-gray-500">
              분석 완료: {formatDate(result.createdAt)}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
            {result.content}
          </pre>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        💡 AI가 제안한 개선사항을 참고하여 메모를 수정해보세요.
      </div>
    </div>
  );
}
