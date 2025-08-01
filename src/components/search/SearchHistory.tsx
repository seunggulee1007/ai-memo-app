'use client';

import { useState, useEffect } from 'react';
import { SearchHistoryManager } from '@/lib/searchHistory';
import type { SearchHistoryItem } from '@/lib/searchHistory';
import { SearchAnalyticsManager } from '@/lib/searchAnalytics';

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void;
  currentQuery?: string;
}

export default function SearchHistory({ onSelectQuery }: SearchHistoryProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [popularQueries, setPopularQueries] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    averageResults: 0,
    mostPopularQuery: '',
  });

  // 검색 히스토리 로드
  useEffect(() => {
    const loadSearchHistory = () => {
      const history = SearchHistoryManager.getHistory();
      setSearchHistory(history);

      // 검색 통계 로드
      const analytics = SearchAnalyticsManager.generateAnalytics(30);
      setSearchStats({
        totalSearches: analytics.totalSearches,
        averageResults: analytics.averageResults,
        mostPopularQuery: analytics.mostPopularQuery || '',
      });
    };

    loadSearchHistory();
  }, []);

  // 인기 검색어 로드 (실제로는 서버에서 가져와야 함)
  useEffect(() => {
    const loadPopularQueries = async () => {
      try {
        // 실제 구현에서는 서버 API를 호출하여 인기 검색어를 가져옴
        // 현재는 더미 데이터 사용
        const popular = [
          '프로젝트',
          '회의록',
          '아이디어',
          '계획',
          '리뷰',
          '개발',
          '디자인',
          '마케팅',
        ];
        setPopularQueries(popular);
      } catch (error) {
        console.error('인기 검색어 로드 오류:', error);
      }
    };

    loadPopularQueries();
  }, []);

  // 검색어 추가
  const addToHistory = (query: string) => {
    SearchHistoryManager.addToHistory(query);
    const history = SearchHistoryManager.getHistory();
    setSearchHistory(history);
  };

  // 검색어 선택
  const handleSelectQuery = (query: string) => {
    onSelectQuery(query);
    addToHistory(query);
    setShowHistory(false);
  };

  // 검색어 삭제
  const removeFromHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SearchHistoryManager.removeFromHistory(query);
    const history = SearchHistoryManager.getHistory();
    setSearchHistory(history);
  };

  // 히스토리 전체 삭제
  const clearHistory = () => {
    SearchHistoryManager.clearHistory();
    setSearchHistory([]);
  };

  // 시간 포맷팅
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return new Date(timestamp).toLocaleDateString('ko-KR');
  };

  if (!showHistory) {
    return (
      <button
        onClick={() => setShowHistory(true)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
      >
        <span className="mr-1">📋</span>
        검색 히스토리
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">검색 히스토리</h3>
        <button
          onClick={() => setShowHistory(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 최근 검색어 */}
      {searchHistory.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">최근 검색어</h4>
            <button
              onClick={clearHistory}
              className="text-xs text-red-500 hover:text-red-700"
            >
              전체 삭제
            </button>
          </div>
          <div className="space-y-2">
            {searchHistory.slice(0, 5).map((item) => (
              <div
                key={item.query}
                onClick={() => handleSelectQuery(item.query)}
                className="flex justify-between items-center p-2 rounded hover:bg-gray-50 cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{item.query}</div>
                  <div className="text-xs text-gray-500">
                    {formatTime(item.timestamp)} • {item.count}회 검색
                  </div>
                </div>
                <button
                  onClick={(e) => removeFromHistory(item.query, e)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 통계 */}
      {searchStats.totalSearches > 0 && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-2">검색 통계</h4>
          <div className="space-y-1 text-xs text-blue-600">
            <div>총 검색: {searchStats.totalSearches}회</div>
            <div>평균 결과: {searchStats.averageResults}개</div>
            {searchStats.mostPopularQuery && (
              <div>인기 검색어: "{searchStats.mostPopularQuery}"</div>
            )}
          </div>
        </div>
      )}

      {/* 인기 검색어 */}
      {popularQueries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            인기 검색어
          </h4>
          <div className="flex flex-wrap gap-2">
            {popularQueries.map((query) => (
              <button
                key={query}
                onClick={() => handleSelectQuery(query)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 히스토리가 없을 때 */}
      {searchHistory.length === 0 && popularQueries.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>검색 히스토리가 없습니다.</p>
          <p className="text-sm">메모를 검색해보세요!</p>
        </div>
      )}
    </div>
  );
}
