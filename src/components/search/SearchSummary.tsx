'use client';

interface SearchSummaryProps {
  totalResults: number;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  searchTime?: number;
  filters?: {
    tagIds: string[];
    startDate: string;
    endDate: string;
    sortBy: string;
  };
}

export default function SearchSummary({
  totalResults,
  searchQuery,
  currentPage,
  totalPages,
  searchTime,
  filters,
}: SearchSummaryProps) {
  const hasFilters =
    filters &&
    (filters.tagIds.length > 0 ||
      filters.startDate ||
      filters.endDate ||
      filters.sortBy !== 'updatedAt');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        {/* 검색 결과 요약 */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {totalResults.toLocaleString()}
            </span>
            개의 메모를 찾았습니다
            {searchQuery && (
              <span className="text-gray-500">
                {' '}
                ("<span className="font-medium">{searchQuery}</span>" 검색)
              </span>
            )}
          </div>

          {/* 검색 시간 */}
          {searchTime && (
            <div className="text-xs text-gray-500">⚡ {searchTime}ms</div>
          )}
        </div>

        {/* 페이지 정보 */}
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            {currentPage} / {totalPages} 페이지
          </div>
        )}
      </div>

      {/* 필터 정보 */}
      {hasFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>🔍 적용된 필터:</span>
            <div className="flex flex-wrap gap-1">
              {filters.tagIds.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  태그 {filters.tagIds.length}개
                </span>
              )}
              {(filters.startDate || filters.endDate) && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  날짜 범위
                </span>
              )}
              {filters.sortBy !== 'updatedAt' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  {filters.sortBy === 'relevance' && '관련성 순'}
                  {filters.sortBy === 'createdAt' && '작성일 순'}
                  {filters.sortBy === 'title' && '제목 순'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과가 없을 때 */}
      {totalResults === 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            💡 검색 조건을 변경하거나 다른 키워드를 시도해보세요.
          </div>
        </div>
      )}
    </div>
  );
}
