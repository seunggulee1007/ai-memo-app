'use client';

// import { useState } from 'react';
import SearchResultCard from './SearchResultCard';
import SearchSummary from './SearchSummary';

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
  searchTime?: number;
  filters?: {
    tagIds: string[];
    startDate: string;
    endDate: string;
    sortBy: string;
  };
}

export default function SearchResults({
  memos,
  isLoading,
  searchQuery,
  totalResults,
  currentPage,
  totalPages,
  onPageChange,
  searchTime,
  filters,
}: SearchResultsProps) {
  // const [expandedMemo, setExpandedMemo] = useState<string | null>(null);

  // 태그 클릭 핸들러
  const handleTagClick = (tagName: string) => {
    // 태그 클릭 시 해당 태그로 검색하도록 구현 가능
    console.log('Tag clicked:', tagName);
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
      <SearchSummary
        totalResults={totalResults}
        searchQuery={searchQuery}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTime={searchTime}
        filters={filters}
      />

      {/* 메모 목록 */}
      <div className="space-y-4">
        {memos.map((memo) => (
          <SearchResultCard
            key={memo.id}
            memo={memo}
            searchQuery={searchQuery}
            onTagClick={handleTagClick}
          />
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
