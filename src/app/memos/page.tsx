'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdvancedSearch, {
  SearchParams,
} from '@/components/search/AdvancedSearch';
import SearchResults from '@/components/search/SearchResults';
import Link from 'next/link';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Memo {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  score?: number; // AI 의미 검색 점수
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

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

  // 초기 메모 목록 로드
  useEffect(() => {
    fetchMemos();
  }, [currentPage]);

  const fetchMemos = async (searchParams?: SearchParams) => {
    try {
      setLoading(true);

      if (searchParams) {
        // 고급 검색 실행
        await performAdvancedSearch(searchParams);
      } else {
        // 기본 메모 목록 로드
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
        });

        const response = await fetch(`/api/memos?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMemos(data.memos || []);
          setTotalResults(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
          setSearchQuery('');
        } else {
          console.error('메모 목록을 불러오는데 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('메모 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 고급 검색 실행
  const performAdvancedSearch = async (params: SearchParams) => {
    try {
      const searchParams = new URLSearchParams();

      // 기본 검색 파라미터
      if (params.search) searchParams.append('search', params.search);
      params.tagIds.forEach((tagId) => searchParams.append('tagId', tagId));
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      searchParams.append('sortBy', params.sortBy);
      searchParams.append('sortOrder', params.sortOrder);
      searchParams.append('page', '1');
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
          setSearchQuery(params.search);
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
          setSearchQuery(params.search);
        } else {
          throw new Error('검색에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setMemos([]);
      setTotalResults(0);
      setTotalPages(1);
    }
  };

  // 검색 핸들러
  const handleSearch = (params: SearchParams) => {
    setCurrentPage(1);
    fetchMemos(params);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">메모 목록</h1>
          <Link
            href="/memos/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            새 메모 작성
          </Link>
        </div>

        {/* 고급 검색 */}
        <AdvancedSearch
          tags={tags}
          onSearch={handleSearch}
          isLoading={loading}
        />

        {/* 검색 결과 */}
        <SearchResults
          memos={memos}
          isLoading={loading}
          searchQuery={searchQuery}
          totalResults={totalResults}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardLayout>
  );
}
