'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import AIAnalysisButton from '@/components/ai/AIAnalysisButton';
import AIAnalysisResult from '@/components/ai/AIAnalysisResult';
import TagManager from '@/components/tags/TagManager';
import Link from 'next/link';

interface Memo {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function EditMemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
        setTitle(data.title);
        setContent(data.content);
        setIsPublic(data.isPublic);
        setSelectedTags(
          data.tags?.map(
            (tag: { id: string; name: string; color: string }) => tag.id
          ) || []
        );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { id } = await params;
      const response = await fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isPublic,
          tagIds: selectedTags,
        }),
      });

      if (response.ok) {
        const updatedMemo = await response.json();
        router.push(`/memos/${updatedMemo.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '메모 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('메모 수정 오류:', error);
      setError('메모 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold text-gray-900">메모 수정</h1>
          <div className="flex items-center space-x-2">
            <AIAnalysisButton
              memoId={memo.id}
              onAnalysisComplete={handleAnalysisComplete}
            />
            <Link
              href={`/memos/${memo.id}`}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              취소
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

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              제목 *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="메모 제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* 공개 설정 */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPublic"
                className="ml-2 block text-sm text-gray-900"
              >
                공개 메모로 설정
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              공개 메모는 다른 사용자들이 볼 수 있습니다.
            </p>
          </div>

          {/* 내용 */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="메모 내용을 입력하세요..."
            />
          </div>

          {/* 태그 선택 */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 선택
            </label>
            <TagManager
              onTagSelect={setSelectedTags}
              selectedTags={selectedTags}
              showCreateButton={false}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <Link
              href={`/memos/${memo.id}`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
