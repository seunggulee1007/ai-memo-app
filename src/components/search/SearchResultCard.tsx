'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import SearchResultHighlight from './SearchResultHighlight';

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
  score?: number;
}

interface SearchResultCardProps {
  memo: Memo;
  searchQuery: string;
  onTagClick?: (tagName: string) => void;
}

export default function SearchResultCard({
  memo,
  searchQuery,
  onTagClick,
}: SearchResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 메모 내용 미리보기 생성
  const getContentPreview = (content: string, maxLength: number = 200) => {
    const plainText = content.replace(/<[^>]*>/g, ''); // HTML 태그 제거
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // 관련성 점수 색상
  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // 검색어가 포함된 위치 찾기
  const findSearchContext = (text: string, query: string) => {
    if (!query.trim()) return null;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return null;

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    let context = text.substring(start, end);

    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context;
  };

  const searchContext = findSearchContext(memo.content, searchQuery);

  return (
    <div
      className={`bg-white rounded-lg border transition-all duration-200 ${
        isHovered
          ? 'border-indigo-300 shadow-lg transform -translate-y-1'
          : 'border-gray-200 shadow-sm hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 메모 헤더 */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/memos/${memo.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
            >
              <SearchResultHighlight
                text={memo.title}
                searchQuery={searchQuery}
                className="hover:text-indigo-600"
              />
            </Link>

            {/* AI 검색 점수 표시 */}
            {memo.score !== undefined && (
              <div
                className={`inline-flex items-center mt-2 px-2 py-1 text-xs rounded-full ${getRelevanceColor(memo.score)}`}
              >
                <span className="mr-1">🤖</span>
                관련도: {memo.score}%
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 ml-4 flex-shrink-0">
            <div className="text-right">
              <div className="font-medium">
                {format(new Date(memo.updatedAt), 'MM.dd', { locale: ko })}
              </div>
              <div className="text-xs">
                {format(new Date(memo.updatedAt), 'HH:mm', { locale: ko })}
              </div>
            </div>
          </div>
        </div>

        {/* 검색 컨텍스트 (검색어가 포함된 부분) */}
        {searchContext && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-gray-700 leading-relaxed">
              <SearchResultHighlight
                text={searchContext}
                searchQuery={searchQuery}
                className="font-medium"
              />
            </div>
          </div>
        )}

        {/* 메모 내용 */}
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed text-sm">
            {isExpanded ? (
              <SearchResultHighlight
                text={memo.content}
                searchQuery={searchQuery}
              />
            ) : (
              <SearchResultHighlight
                text={getContentPreview(memo.content)}
                searchQuery={searchQuery}
              />
            )}
          </p>

          {memo.content.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 font-medium"
            >
              {isExpanded ? '접기' : '더 보기'}
            </button>
          )}
        </div>

        {/* 태그 */}
        {memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memo.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagClick?.(tag.name)}
                className="px-2 py-1 text-xs rounded-full font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="px-4 pb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <Link
            href={`/memos/${memo.id}/edit`}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            ✏️ 편집
          </Link>
          <Link
            href={`/memos/${memo.id}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
          >
            👁️ 보기
          </Link>
        </div>

        {/* 메타 정보 */}
        <div className="text-xs text-gray-500">
          {memo.content.length > 200 && (
            <span className="mr-2">📝 {memo.content.length}자</span>
          )}
          {memo.tags.length > 0 && <span>🏷️ {memo.tags.length}개 태그</span>}
        </div>
      </div>
    </div>
  );
}
