'use client';

import { useState, useEffect } from 'react';
import { SearchAnalyticsManager } from '@/lib/searchAnalytics';
import type { SearchAnalytics } from '@/lib/searchAnalytics';

interface SearchAnalyticsProps {
  days?: number;
}

export default function SearchAnalytics({ days = 30 }: SearchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = () => {
      setIsLoading(true);
      const data = SearchAnalyticsManager.generateAnalytics(days);
      setAnalytics(data);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [days]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalSearches === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p>아직 검색 데이터가 없습니다</p>
          <p className="text-sm mt-1">
            검색을 시작하면 분석 데이터가 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">검색 분석</h3>
        <span className="text-sm text-gray-500">최근 {days}일간의 데이터</span>
      </div>

      {/* 기본 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.totalSearches}
          </div>
          <div className="text-sm text-blue-600">총 검색 수</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {analytics.uniqueQueries}
          </div>
          <div className="text-sm text-green-600">고유 검색어</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.averageResults}
          </div>
          <div className="text-sm text-purple-600">평균 결과 수</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {analytics.searchPerformance.averageTime}ms
          </div>
          <div className="text-sm text-orange-600">평균 검색 시간</div>
        </div>
      </div>

      {/* 인기 검색어 */}
      {analytics.topQueries.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            인기 검색어
          </h4>
          <div className="space-y-2">
            {analytics.topQueries.slice(0, 5).map((query, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 truncate">
                    {query.query}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{query.count}회</span>
                  <span>평균 {query.averageResults}개 결과</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 트렌드 */}
      {analytics.searchTrends.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            검색 트렌드
          </h4>
          <div className="h-32 flex items-end space-x-1">
            {analytics.searchTrends.slice(-7).map((trend, index) => {
              const maxCount = Math.max(
                ...analytics.searchTrends.map((t) => t.count)
              );
              const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-indigo-500 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(trend.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 필터 사용 통계 */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          필터 사용 현황
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">태그 필터</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.filterUsage.tagFilter}회
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">날짜 필터</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.filterUsage.dateFilter}회
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">AI 의미 검색</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.filterUsage.semanticSearch}회
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">관련성 정렬</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.filterUsage.sortByRelevance}회
            </span>
          </div>
        </div>
      </div>

      {/* 성능 정보 */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">성능 정보</h4>
        <div className="space-y-2">
          {analytics.searchPerformance.fastestQuery && (
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="text-sm text-green-700">가장 빠른 검색</span>
              <span className="text-sm font-medium text-green-900 truncate max-w-48">
                "{analytics.searchPerformance.fastestQuery}"
              </span>
            </div>
          )}
          {analytics.searchPerformance.slowestQuery && (
            <div className="flex justify-between items-center p-2 bg-red-50 rounded">
              <span className="text-sm text-red-700">가장 느린 검색</span>
              <span className="text-sm font-medium text-red-900 truncate max-w-48">
                "{analytics.searchPerformance.slowestQuery}"
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
