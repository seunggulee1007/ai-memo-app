'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdvancedSearch, {
  SearchParams,
} from '@/components/search/AdvancedSearch';
import SearchResults from '@/components/search/SearchResults';

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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [memos, setMemos] = useState<Memo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 태그 목록 로드
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error('태그 로드 오류:', error);
      }
    };

    fetchTags();
  }, []);

  // URL 파라미터에서 검색 조건 로드
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const tagIds = searchParams.getAll('tagId');
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const useSemanticSearch = searchParams.get('useSemanticSearch') === 'true';
    const page = parseInt(searchParams.get('page') || '1');

    setSearchQuery(search);
    setCurrentPage(page);

    // 검색 조건이 있으면 자동으로 검색 실행
    if (search || tagIds.length > 0 || startDate || endDate) {
      performSearch(
        {
          search,
          tagIds,
          startDate,
          endDate,
          sortBy: sortBy as SearchParams['sortBy'],
          sortOrder: sortOrder as SearchParams['sortOrder'],
          useSemanticSearch,
        },
        page
      );
    }
  }, [searchParams]);

  // 검색 실행 함수
  const performSearch = async (params: SearchParams, page: number = 1) => {
    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams();

      // 기본 검색 파라미터
      if (params.search) searchParams.append('search', params.search);
      params.tagIds.forEach((tagId) => searchParams.append('tagId', tagId));
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      searchParams.append('sortBy', params.sortBy);
      searchParams.append('sortOrder', params.sortOrder);
      searchParams.append('page', page.toString());
      searchParams.append('limit', '10');

      // AI 의미 검색 사용 여부에 따라 다른 API 호출
      if (params.useSemanticSearch && params.search) {
        // AI 의미 검색 API 호출
        const semanticResponse = await fetch(
          `/api/ai/semantic-search?q=${encodeURIComponent(params.search)}&limit=10`
        );

        if (semanticResponse.ok) {
          const semanticData = await semanticResponse.json();
          setMemos(
            semanticData.results.map(
              (result: { memo: Memo; score: number }) => ({
                ...result.memo,
                score: result.score,
              })
            )
          );
          setTotalResults(
            semanticData.totalFound || semanticData.results.length
          );
          setTotalPages(1); // AI 검색은 페이지네이션 없음
        } else {
          throw new Error('AI 검색에 실패했습니다.');
        }
      } else {
        // 일반 검색 API 호출
        const response = await fetch(`/api/memos?${searchParams.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setMemos(data.memos || []);
          setTotalResults(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
        } else {
          throw new Error('검색에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setMemos([]);
      setTotalResults(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 핸들러
  const handleSearch = (params: SearchParams) => {
    // URL 업데이트
    const newSearchParams = new URLSearchParams();
    if (params.search) newSearchParams.append('search', params.search);
    params.tagIds.forEach((tagId) => newSearchParams.append('tagId', tagId));
    if (params.startDate) newSearchParams.append('startDate', params.startDate);
    if (params.endDate) newSearchParams.append('endDate', params.endDate);
    newSearchParams.append('sortBy', params.sortBy);
    newSearchParams.append('sortOrder', params.sortOrder);
    if (params.useSemanticSearch)
      newSearchParams.append('useSemanticSearch', 'true');
    newSearchParams.append('page', '1');

    router.push(`/search?${newSearchParams.toString()}`);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('page', page.toString());
    router.push(`/search?${currentParams.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">고급 검색</h1>
        <p className="text-gray-600">
          메모 제목, 내용, 태그, 날짜 등을 조합하여 원하는 메모를 찾아보세요.
        </p>
      </div>

      <AdvancedSearch
        tags={tags}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      <SearchResults
        memos={memos}
        isLoading={isLoading}
        searchQuery={searchQuery}
        totalResults={totalResults}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
