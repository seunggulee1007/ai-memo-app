'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchHistory from './SearchHistory';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AdvancedSearchProps {
  tags: Tag[];
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  search: string;
  tagIds: string[];
  startDate: string;
  endDate: string;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  useSemanticSearch: boolean;
}

export default function AdvancedSearch({
  tags,
  onSearch,
  isLoading = false,
}: AdvancedSearchProps) {
  const searchParams = useSearchParams();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchParamsState, setSearchParamsState] = useState<SearchParams>({
    search: searchParams.get('search') || '',
    tagIds: searchParams.getAll('tagId'),
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    sortBy:
      (searchParams.get('sortBy') as SearchParams['sortBy']) || 'updatedAt',
    sortOrder:
      (searchParams.get('sortOrder') as SearchParams['sortOrder']) || 'desc',
    useSemanticSearch: searchParams.get('useSemanticSearch') === 'true',
  });

  const handleSearch = () => {
    onSearch(searchParamsState);
  };

  const handleReset = () => {
    const resetParams: SearchParams = {
      search: '',
      tagIds: [],
      startDate: '',
      endDate: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      useSemanticSearch: false,
    };
    setSearchParamsState(resetParams);
    onSearch(resetParams);
  };

  const toggleTag = (tagId: string) => {
    setSearchParamsState((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistorySelect = (query: string) => {
    setSearchParamsState((prev) => ({
      ...prev,
      search: query,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* 기본 검색 영역 */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="메모 검색..."
            value={searchParamsState.search}
            onChange={(e) =>
              setSearchParamsState((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            onKeyPress={handleKeyPress}
            onFocus={() => setShowHistory(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-2.5">
            <span className="text-gray-400">🔍</span>
          </div>

          {/* 검색 히스토리 드롭다운 */}
          {showHistory && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1">
              <SearchHistory
                onSelectQuery={handleHistorySelect}
                currentQuery={searchParamsState.search}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {isExpanded ? '간단히' : '고급 검색'}
        </button>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 고급 검색 옵션 */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* 태그 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 필터
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    searchParamsState.tagIds.includes(tag.id)
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: searchParamsState.tagIds.includes(tag.id)
                      ? tag.color + '20'
                      : undefined,
                    borderColor: searchParamsState.tagIds.includes(tag.id)
                      ? tag.color
                      : undefined,
                    color: searchParamsState.tagIds.includes(tag.id)
                      ? tag.color
                      : undefined,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 범위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 날짜
              </label>
              <input
                type="date"
                value={searchParamsState.startDate}
                onChange={(e) =>
                  setSearchParamsState((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 날짜
              </label>
              <input
                type="date"
                value={searchParamsState.endDate}
                onChange={(e) =>
                  setSearchParamsState((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬 기준
              </label>
              <select
                value={searchParamsState.sortBy}
                onChange={(e) =>
                  setSearchParamsState((prev) => ({
                    ...prev,
                    sortBy: e.target.value as SearchParams['sortBy'],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="updatedAt">수정일</option>
                <option value="createdAt">작성일</option>
                <option value="title">제목</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬 순서
              </label>
              <select
                value={searchParamsState.sortOrder}
                onChange={(e) =>
                  setSearchParamsState((prev) => ({
                    ...prev,
                    sortOrder: e.target.value as SearchParams['sortOrder'],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>

          {/* AI 의미 검색 토글 */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchParamsState.useSemanticSearch}
                onChange={(e) =>
                  setSearchParamsState((prev) => ({
                    ...prev,
                    useSemanticSearch: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                AI 의미 검색 사용
              </span>
            </label>
            <span className="text-xs text-gray-500">🤖</span>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      )}

      {/* 검색 히스토리 버튼 */}
      <div className="mt-3 flex justify-end">
        <SearchHistory onSelectQuery={handleHistorySelect} />
      </div>
    </div>
  );
}
