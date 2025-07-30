'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AIAnalysisButton from '@/components/ai/AIAnalysisButton';
import AIAnalysisResult from '@/components/ai/AIAnalysisResult';
import Link from 'next/link';

interface Memo {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function MemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    id: string;
    memoId: string;
    type: string;
    content: string;
    applied: boolean;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    const fetchMemoData = async () => {
      const { id } = await params;
      await fetchMemo(id);
    };
    fetchMemoData();
  }, [params]);

  const fetchMemo = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/memos/${id}`);

      if (response.ok) {
        const data = await response.json();
        setMemo(data);
      } else if (response.status === 404) {
        setError('메모를 찾을 수 없습니다.');
      } else {
        setError('메모를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('메모 조회 오류:', error);
      setError('메모를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeleting(true);
      const { id } = await params;
      const response = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/memos');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '메모 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('메모 삭제 오류:', error);
      setError('메모 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAnalysisComplete = (result: {
    id: string;
    memoId: string;
    type: string;
    content: string;
    applied: boolean;
    createdAt: string;
  }) => {
    setAnalysisResult(result);
    // 분석 완료 후 메모 다시 로드
    const fetchMemoData = async () => {
      const { id } = await params;
      await fetchMemo(id);
    };
    fetchMemoData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="text-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !memo) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">
                {error || '메모를 찾을 수 없습니다.'}
              </p>
              <Link
                href="/memos"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{memo.title}</h1>
          <div className="flex items-center space-x-2">
            <AIAnalysisButton
              memoId={memo.id}
              onAnalysisComplete={handleAnalysisComplete}
            />
            <Link
              href={`/memos/${memo.id}/edit`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              편집
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
            <Link
              href="/memos"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              목록으로
            </Link>
          </div>
        </div>

        {/* AI 분석 결과 */}
        {analysisResult && (
          <AIAnalysisResult
            result={analysisResult}
            onClose={() => setAnalysisResult(null)}
          />
        )}

        {/* 메모 정보 */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {memo.isPublic && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  공개
                </span>
              )}
              <span className="text-sm text-gray-500">
                수정일: {formatDate(memo.updatedAt)}
              </span>
              <span className="text-sm text-gray-500">
                작성일: {formatDate(memo.createdAt)}
              </span>
            </div>
          </div>

          {/* 태그 */}
          {memo.tags && memo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {memo.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 내용 */}
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: memo.content }} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
