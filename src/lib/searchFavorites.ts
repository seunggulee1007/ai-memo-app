export interface SearchFavorite {
  id: string;
  name: string;
  query: string;
  filters: {
    tagIds: string[];
    startDate: string;
    endDate: string;
    sortBy: string;
    sortOrder: string;
    useSemanticSearch: boolean;
  };
  createdAt: number;
  lastUsed: number;
  useCount: number;
  description?: string;
}

export class SearchFavoritesManager {
  private static STORAGE_KEY = 'search_favorites';
  private static MAX_FAVORITES = 20;

  /**
   * 즐겨찾기 목록 가져오기
   */
  static getFavorites(): SearchFavorite[] {
    try {
      const favorites = localStorage.getItem(this.STORAGE_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('검색 즐겨찾기 로드 오류:', error);
      return [];
    }
  }

  /**
   * 즐겨찾기 추가
   */
  static addFavorite(
    name: string,
    query: string,
    filters: SearchFavorite['filters'],
    description?: string
  ): string {
    const favorites = this.getFavorites();
    const id = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFavorite: SearchFavorite = {
      id,
      name,
      query,
      filters,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
      description,
    };

    favorites.unshift(newFavorite);

    // 최대 개수 제한
    const limitedFavorites = favorites.slice(0, this.MAX_FAVORITES);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedFavorites));

    return id;
  }

  /**
   * 즐겨찾기 사용 (사용 횟수 및 마지막 사용 시간 업데이트)
   */
  static useFavorite(id: string): SearchFavorite | null {
    const favorites = this.getFavorites();
    const index = favorites.findIndex((fav) => fav.id === id);

    if (index === -1) return null;

    favorites[index].useCount += 1;
    favorites[index].lastUsed = Date.now();

    // 사용 빈도순으로 정렬
    favorites.sort((a, b) => b.useCount - a.useCount);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    return favorites[index];
  }

  /**
   * 즐겨찾기 수정
   */
  static updateFavorite(
    id: string,
    updates: Partial<Pick<SearchFavorite, 'name' | 'description'>>
  ): boolean {
    const favorites = this.getFavorites();
    const index = favorites.findIndex((fav) => fav.id === id);

    if (index === -1) return false;

    favorites[index] = { ...favorites[index], ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));

    return true;
  }

  /**
   * 즐겨찾기 삭제
   */
  static removeFavorite(id: string): boolean {
    const favorites = this.getFavorites();
    const filteredFavorites = favorites.filter((fav) => fav.id !== id);

    if (filteredFavorites.length === favorites.length) {
      return false; // 삭제할 항목이 없음
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredFavorites));
    return true;
  }

  /**
   * 즐겨찾기 전체 삭제
   */
  static clearFavorites(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 인기 즐겨찾기 가져오기 (사용 빈도 기준)
   */
  static getPopularFavorites(limit: number = 5): SearchFavorite[] {
    const favorites = this.getFavorites();
    return favorites.sort((a, b) => b.useCount - a.useCount).slice(0, limit);
  }

  /**
   * 최근 즐겨찾기 가져오기 (마지막 사용 시간 기준)
   */
  static getRecentFavorites(limit: number = 5): SearchFavorite[] {
    const favorites = this.getFavorites();
    return favorites.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, limit);
  }

  /**
   * 즐겨찾기 검색 (이름 또는 설명에서 검색)
   */
  static searchFavorites(query: string): SearchFavorite[] {
    const favorites = this.getFavorites();
    const lowerQuery = query.toLowerCase();

    return favorites.filter(
      (fav) =>
        fav.name.toLowerCase().includes(lowerQuery) ||
        fav.description?.toLowerCase().includes(lowerQuery) ||
        fav.query.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 즐겨찾기 통계
   */
  static getStats() {
    const favorites = this.getFavorites();
    const totalFavorites = favorites.length;
    const totalUses = favorites.reduce((sum, fav) => sum + fav.useCount, 0);
    const averageUses =
      totalFavorites > 0 ? Math.round(totalUses / totalFavorites) : 0;

    return {
      totalFavorites,
      totalUses,
      averageUses,
      mostUsedFavorite: favorites[0] || null,
    };
  }

  /**
   * 즐겨찾기 내보내기
   */
  static exportFavorites(): string {
    const favorites = this.getFavorites();
    return JSON.stringify(favorites, null, 2);
  }

  /**
   * 즐겨찾기 가져오기
   */
  static importFavorites(jsonData: string): boolean {
    try {
      const favorites = JSON.parse(jsonData) as SearchFavorite[];

      // 데이터 유효성 검사
      const isValid = favorites.every(
        (fav) => fav.id && fav.name && fav.query && fav.filters
      );

      if (!isValid) {
        throw new Error('Invalid favorites data');
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('즐겨찾기 가져오기 오류:', error);
      return false;
    }
  }
}
