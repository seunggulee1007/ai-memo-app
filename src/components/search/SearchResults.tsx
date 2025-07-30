'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  score?: number; // AI 의미 검색 점수
}

interface SearchResultsProps {
  memos: Memo[];
  isLoading: boolean;
  searchQuery: string;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function SearchResults({
  memos,
  isLoading,
  searchQuery,
  totalResults,
  currentPage,
  totalPages,
  onPageChange,
}: SearchResultsProps) {
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null);

  // 검색어 하이라이팅 함수
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 메모 내용 미리보기 생성
  const getContentPreview = (content: string, maxLength: number = 200) => {
    const plainText = content.replace(/<[^>]*>/g, ''); // HTML 태그 제거
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">검색 중...</span>
      </div>
    );
  }

  if (memos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          검색 결과가 없습니다
        </h3>
        <p className="text-gray-500">
          {searchQuery
            ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
            : '검색 조건을 변경해보세요.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 결과 요약 */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          총 {totalResults}개의 메모를 찾았습니다
          {searchQuery && ` ("${searchQuery}" 검색)`}
        </span>
        {totalPages > 1 && (
          <span>
            {currentPage} / {totalPages} 페이지
          </span>
        )}
      </div>

      {/* 메모 목록 */}
      <div className="space-y-4">
        {memos.map((memo) => (
          <div
            key={memo.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            {/* 메모 헤더 */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <Link
                  href={`/memos/${memo.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {highlightText(memo.title, searchQuery)}
                </Link>

                {/* AI 검색 점수 표시 */}
                {memo.score !== undefined && (
                  <div className="inline-flex items-center ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    <span className="mr-1">🤖</span>
                    관련도: {memo.score}%
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500">
                {format(new Date(memo.updatedAt), 'yyyy.MM.dd HH:mm', {
                  locale: ko,
                })}
              </div>
            </div>

            {/* 메모 내용 */}
            <div className="mb-3">
              <p className="text-gray-700 leading-relaxed">
                {expandedMemo === memo.id
                  ? highlightText(memo.content, searchQuery)
                  : highlightText(getContentPreview(memo.content), searchQuery)}
              </p>

              {memo.content.length > 200 && (
                <button
                  onClick={() =>
                    setExpandedMemo(expandedMemo === memo.id ? null : memo.id)
                  }
                  className="text-indigo-600 hover:text-indigo-800 text-sm mt-1"
                >
                  {expandedMemo === memo.id ? '접기' : '더 보기'}
                </button>
              )}
            </div>

            {/* 태그 */}
            {memo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {memo.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      border: `1px solid ${tag.color}40`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-2">
              <Link
                href={`/memos/${memo.id}/edit`}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
              >
                편집
              </Link>
              <Link
                href={`/memos/${memo.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded hover:bg-indigo-50"
              >
                보기
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum =
              Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            if (pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 text-sm border rounded-lg ${
                  pageNum === currentPage
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
