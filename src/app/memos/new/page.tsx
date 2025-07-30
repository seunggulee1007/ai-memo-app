'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import TagManager from '@/components/tags/TagManager';
import Link from 'next/link';

export default function NewMemoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/memos', {
        method: 'POST',
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
        const memo = await response.json();
        router.push(`/memos/${memo.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '메모 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('메모 생성 오류:', error);
      setError('메모 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">새 메모 작성</h1>
          <Link
            href="/memos"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            목록으로 돌아가기
          </Link>
        </div>

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

          {/* 내용 */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="메모 내용을 입력하세요..."
              autofocus={false}
            />
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/memos"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md text-sm font-medium"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
