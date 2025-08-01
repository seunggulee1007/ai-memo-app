import { useState, useEffect, useMemo, useCallback } from 'react';

// 간단한 debounce 함수 구현
function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newTimeoutId = setTimeout(() => callback(...args), delay);
      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

interface SearchSuggestions {
  titles: string[];
  tags: string[];
  recentSearches: string[];
}

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    titles: [],
    tags: [],
    recentSearches: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions({
        titles: [],
        tags: [],
        recentSearches: [],
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('검색 제안을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useDebounce(
    fetchSuggestions as (...args: unknown[]) => unknown,
    300
  );

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  // 모든 제안을 하나의 배열로 합치기
  const allSuggestions = useMemo(() => {
    const all = [
      ...suggestions.titles.map((title) => ({
        text: title,
        type: 'title' as const,
      })),
      ...suggestions.tags.map((tag) => ({ text: tag, type: 'tag' as const })),
      ...suggestions.recentSearches.map((search) => ({
        text: search,
        type: 'recent' as const,
      })),
    ];

    // 중복 제거
    const unique = all.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.text === item.text)
    );

    return unique.slice(0, 10); // 최대 10개까지만 표시
  }, [suggestions]);

  return {
    suggestions,
    allSuggestions,
    loading,
    error,
  };
}
