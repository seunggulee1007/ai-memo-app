export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number;
  tags?: string[];
  resultCount?: number;
}

export class SearchHistoryManager {
  private static STORAGE_KEY = 'search_history';
  private static MAX_HISTORY = 20;
  private static MAX_QUERY_LENGTH = 100;

  /**
   * 검색 히스토리 가져오기
   */
  static getHistory(): SearchHistoryItem[] {
    try {
      const history = localStorage.getItem(this.STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('검색 히스토리 로드 오류:', error);
      return [];
    }
  }

  /**
   * 검색 히스토리에 추가
   */
  static addToHistory(
    query: string,
    tags?: string[],
    resultCount?: number
  ): void {
    if (!query.trim() || query.length > this.MAX_QUERY_LENGTH) {
      return;
    }

    try {
      const history = this.getHistory();
      const existingIndex = history.findIndex((item) => item.query === query);

      if (existingIndex >= 0) {
        // 기존 항목 업데이트
        history[existingIndex].count += 1;
        history[existingIndex].timestamp = Date.now();
        if (tags) history[existingIndex].tags = tags;
        if (resultCount !== undefined)
          history[existingIndex].resultCount = resultCount;
      } else {
        // 새 항목 추가
        history.unshift({
          query: query.trim(),
          timestamp: Date.now(),
          count: 1,
          tags,
          resultCount,
        });
      }

      // 최대 개수 제한
      const limitedHistory = history.slice(0, this.MAX_HISTORY);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('검색 히스토리 저장 오류:', error);
    }
  }

  /**
   * 검색 히스토리에서 제거
   */
  static removeFromHistory(query: string): void {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter((item) => item.query !== query);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('검색 히스토리 삭제 오류:', error);
    }
  }

  /**
   * 검색 히스토리 전체 삭제
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('검색 히스토리 전체 삭제 오류:', error);
    }
  }

  /**
   * 인기 검색어 가져오기 (사용 빈도 기준)
   */
  static getPopularQueries(limit: number = 10): SearchHistoryItem[] {
    const history = this.getHistory();
    return history.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * 최근 검색어 가져오기 (시간 기준)
   */
  static getRecentQueries(limit: number = 10): SearchHistoryItem[] {
    const history = this.getHistory();
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * 태그별 검색어 가져오기
   */
  static getQueriesByTag(tag: string): SearchHistoryItem[] {
    const history = this.getHistory();
    return history.filter((item) =>
      item.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  /**
   * 검색어 제안 (부분 일치)
   */
  static getSuggestions(query: string, limit: number = 5): string[] {
    if (!query.trim()) return [];

    const history = this.getHistory();
    const suggestions = history
      .filter((item) => item.query.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => item.query);

    return suggestions;
  }

  /**
   * 검색 통계 가져오기
   */
  static getStats() {
    const history = this.getHistory();
    const totalSearches = history.reduce((sum, item) => sum + item.count, 0);
    const uniqueQueries = history.length;
    const averageResults =
      history.reduce((sum, item) => sum + (item.resultCount || 0), 0) /
      history.length;

    return {
      totalSearches,
      uniqueQueries,
      averageResults: Math.round(averageResults) || 0,
      mostPopularQuery: history[0]?.query || null,
    };
  }

  /**
   * 오래된 검색 히스토리 정리 (30일 이상)
   */
  static cleanupOldHistory(): void {
    try {
      const history = this.getHistory();
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filteredHistory = history.filter(
        (item) => item.timestamp > thirtyDaysAgo
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('검색 히스토리 정리 오류:', error);
    }
  }
}
