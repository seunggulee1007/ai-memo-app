export interface SearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  averageResults: number;
  mostPopularQuery: string | null;
  searchTrends: {
    date: string;
    count: number;
  }[];
  topQueries: {
    query: string;
    count: number;
    averageResults: number;
  }[];
  searchPerformance: {
    averageTime: number;
    fastestQuery: string | null;
    slowestQuery: string | null;
  };
  filterUsage: {
    tagFilter: number;
    dateFilter: number;
    semanticSearch: number;
    sortByRelevance: number;
  };
}

export interface SearchEvent {
  query: string;
  timestamp: number;
  resultCount: number;
  searchTime: number;
  filters: {
    tagIds: string[];
    startDate: string;
    endDate: string;
    sortBy: string;
    useSemanticSearch: boolean;
  };
}

export class SearchAnalyticsManager {
  private static STORAGE_KEY = 'search_analytics';
  private static MAX_EVENTS = 1000;

  /**
   * 검색 이벤트 저장
   */
  static logSearchEvent(event: Omit<SearchEvent, 'timestamp'>): void {
    try {
      const events = this.getSearchEvents();
      const newEvent: SearchEvent = {
        ...event,
        timestamp: Date.now(),
      };

      events.unshift(newEvent);

      // 최대 개수 제한
      const limitedEvents = events.slice(0, this.MAX_EVENTS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedEvents));
    } catch (error) {
      console.error('검색 이벤트 저장 오류:', error);
    }
  }

  /**
   * 검색 이벤트 가져오기
   */
  static getSearchEvents(): SearchEvent[] {
    try {
      const events = localStorage.getItem(this.STORAGE_KEY);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('검색 이벤트 로드 오류:', error);
      return [];
    }
  }

  /**
   * 검색 분석 데이터 생성
   */
  static generateAnalytics(days: number = 30): SearchAnalytics {
    const events = this.getSearchEvents();
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEvents = events.filter((event) => event.timestamp > cutoffDate);

    if (recentEvents.length === 0) {
      return this.getEmptyAnalytics();
    }

    // 기본 통계
    const totalSearches = recentEvents.length;
    const uniqueQueries = new Set(recentEvents.map((e) => e.query)).size;
    const averageResults = Math.round(
      recentEvents.reduce((sum, e) => sum + e.resultCount, 0) / totalSearches
    );

    // 가장 인기 있는 검색어
    const queryCounts = new Map<string, number>();
    const queryResults = new Map<string, number[]>();

    recentEvents.forEach((event) => {
      queryCounts.set(event.query, (queryCounts.get(event.query) || 0) + 1);
      if (!queryResults.has(event.query)) {
        queryResults.set(event.query, []);
      }
      queryResults.get(event.query)!.push(event.resultCount);
    });

    const mostPopularQuery =
      Array.from(queryCounts.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      null;

    // 상위 검색어
    const topQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({
        query,
        count,
        averageResults: Math.round(
          queryResults.get(query)!.reduce((sum, r) => sum + r, 0) / count
        ),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 검색 트렌드 (일별)
    const dailyCounts = new Map<string, number>();
    recentEvents.forEach((event) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    const searchTrends = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 검색 성능
    const searchTimes = recentEvents.map((e) => e.searchTime);
    const averageTime = Math.round(
      searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length
    );

    const fastestEvent = recentEvents.reduce((fastest, current) =>
      current.searchTime < fastest.searchTime ? current : fastest
    );
    const slowestEvent = recentEvents.reduce((slowest, current) =>
      current.searchTime > slowest.searchTime ? current : slowest
    );

    // 필터 사용 통계
    const filterUsage = {
      tagFilter: recentEvents.filter((e) => e.filters.tagIds.length > 0).length,
      dateFilter: recentEvents.filter(
        (e) => e.filters.startDate || e.filters.endDate
      ).length,
      semanticSearch: recentEvents.filter((e) => e.filters.useSemanticSearch)
        .length,
      sortByRelevance: recentEvents.filter(
        (e) => e.filters.sortBy === 'relevance'
      ).length,
    };

    return {
      totalSearches,
      uniqueQueries,
      averageResults,
      mostPopularQuery,
      searchTrends,
      topQueries,
      searchPerformance: {
        averageTime,
        fastestQuery: fastestEvent.query,
        slowestQuery: slowestEvent.query,
      },
      filterUsage,
    };
  }

  /**
   * 빈 분석 데이터
   */
  private static getEmptyAnalytics(): SearchAnalytics {
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageResults: 0,
      mostPopularQuery: null,
      searchTrends: [],
      topQueries: [],
      searchPerformance: {
        averageTime: 0,
        fastestQuery: null,
        slowestQuery: null,
      },
      filterUsage: {
        tagFilter: 0,
        dateFilter: 0,
        semanticSearch: 0,
        sortByRelevance: 0,
      },
    };
  }

  /**
   * 검색 이벤트 삭제
   */
  static clearAnalytics(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 특정 기간의 검색 이벤트 가져오기
   */
  static getEventsByDateRange(startDate: Date, endDate: Date): SearchEvent[] {
    const events = this.getSearchEvents();
    return events.filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  /**
   * 검색 패턴 분석
   */
  static analyzeSearchPatterns(): {
    commonPatterns: string[];
    searchHabits: {
      averageQueriesPerDay: number;
      mostActiveHour: number;
      preferredFilters: string[];
    };
  } {
    const events = this.getSearchEvents();
    if (events.length === 0) {
      return {
        commonPatterns: [],
        searchHabits: {
          averageQueriesPerDay: 0,
          mostActiveHour: 0,
          preferredFilters: [],
        },
      };
    }

    // 검색 패턴 분석 (공통 키워드)
    const allWords = events
      .flatMap((e) => e.query.toLowerCase().split(/\s+/))
      .filter((word) => word.length > 1);

    const wordCounts = new Map<string, number>();
    allWords.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    const commonPatterns = Array.from(wordCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // 검색 습관 분석
    const days = new Set(
      events.map((e) => new Date(e.timestamp).toISOString().split('T')[0])
    ).size;
    const averageQueriesPerDay = Math.round(events.length / days);

    const hourCounts = new Map<number, number>();
    events.forEach((event) => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const mostActiveHour =
      Array.from(hourCounts.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      0;

    // 선호하는 필터 분석
    const filterCounts = {
      tagFilter: events.filter((e) => e.filters.tagIds.length > 0).length,
      dateFilter: events.filter((e) => e.filters.startDate || e.filters.endDate)
        .length,
      semanticSearch: events.filter((e) => e.filters.useSemanticSearch).length,
      sortByRelevance: events.filter((e) => e.filters.sortBy === 'relevance')
        .length,
    };

    const preferredFilters = Object.entries(filterCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([filter]) => filter);

    return {
      commonPatterns,
      searchHabits: {
        averageQueriesPerDay,
        mostActiveHour,
        preferredFilters,
      },
    };
  }
}
