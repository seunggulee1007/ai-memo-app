import { db } from '@/lib/db';
import { memos, tags, memoTags } from '@/lib/db/schema';
import { eq, and, sql, desc, asc, gte, lte } from 'drizzle-orm';

export interface SearchFilters {
  search?: string;
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: 'relevance' | 'updatedAt' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  relevance?: number;
}

/**
 * 전문 검색을 사용한 메모 검색
 */
export async function searchMemosWithFullText(
  userId: string,
  filters: SearchFilters
): Promise<{ results: SearchResult[]; total: number }> {
  const {
    search,
    tagIds = [],
    startDate,
    endDate,
    sortBy = 'relevance',
    sortOrder = 'desc',
    limit = 10,
    offset = 0,
  } = filters;

  // 기본 조건
  const whereConditions = [eq(memos.userId, userId)];

  // 전문 검색 조건
  if (search && search.trim()) {
    const searchQuery = search.trim();

    // 한국어 전문 검색 쿼리
    const fullTextCondition = sql`
      to_tsvector('korean', ${memos.title} || ' ' || ${memos.content}) @@ plainto_tsquery('korean', ${searchQuery})
    `;

    whereConditions.push(fullTextCondition);
  }

  // 날짜 범위 필터링
  if (startDate) {
    whereConditions.push(gte(memos.createdAt, new Date(startDate)));
  }
  if (endDate) {
    whereConditions.push(lte(memos.createdAt, new Date(endDate)));
  }

  // 정렬 조건 설정
  let orderByClause;
  if (search && sortBy === 'relevance') {
    // 전문 검색 시 관련성 순으로 정렬
    orderByClause = sql`
      ts_rank(to_tsvector('korean', ${memos.title} || ' ' || ${memos.content}), plainto_tsquery('korean', ${search})) DESC
    `;
  } else {
    // 일반 정렬
    switch (sortBy) {
      case 'title':
        orderByClause =
          sortOrder === 'asc' ? asc(memos.title) : desc(memos.title);
        break;
      case 'createdAt':
        orderByClause =
          sortOrder === 'asc' ? asc(memos.createdAt) : desc(memos.createdAt);
        break;
      case 'updatedAt':
      default:
        orderByClause =
          sortOrder === 'asc' ? asc(memos.updatedAt) : desc(memos.updatedAt);
        break;
    }
  }

  // 메모 조회
  const query = db
    .select({
      id: memos.id,
      title: memos.title,
      content: memos.content,
      createdAt: memos.createdAt,
      updatedAt: memos.updatedAt,
      userId: memos.userId,
      isPublic: memos.isPublic,
      ...(search
        ? {
            relevance: sql<number>`
          ts_rank(to_tsvector('korean', ${memos.title} || ' ' || ${memos.content}), plainto_tsquery('korean', ${search}))
        `,
          }
        : {}),
    })
    .from(memos)
    .where(and(...whereConditions))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const memosData = await query;

  // 태그 정보 조회
  const memosWithTags = await Promise.all(
    memosData.map(async (memo) => {
      const tagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(tags)
        .innerJoin(
          memoTags,
          and(eq(memoTags.tagId, tags.id), eq(memoTags.memoId, memo.id))
        );

      return {
        ...memo,
        tags: tagsData,
      } as SearchResult;
    })
  );

  // 태그 필터링
  let filteredResults = memosWithTags;
  if (tagIds.length > 0) {
    filteredResults = memosWithTags.filter((memo) => {
      const memoTagIds = memo.tags.map((tag) => tag.id);
      return tagIds.every((tagId) => memoTagIds.includes(tagId));
    });
  }

  // 전체 개수 조회
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(memos)
    .where(and(...whereConditions));

  const totalCount = await countQuery;
  const total = totalCount[0]?.count || 0;

  return {
    results: filteredResults,
    total,
  };
}

/**
 * 태그 검색
 */
export async function searchTags(
  userId: string,
  searchQuery: string
): Promise<Array<{ id: string; name: string; color: string }>> {
  if (!searchQuery.trim()) {
    return [];
  }

  const results = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(tags)
    .where(
      and(
        eq(tags.userId, userId),
        sql`to_tsvector('korean', ${tags.name}) @@ plainto_tsquery('korean', ${searchQuery})`
      )
    )
    .limit(10);

  return results;
}

/**
 * 검색 제안 (자동완성용)
 */
export async function getSearchSuggestions(
  userId: string,
  searchQuery: string
): Promise<{
  titles: string[];
  tags: string[];
  recentSearches: string[];
}> {
  if (!searchQuery.trim()) {
    return { titles: [], tags: [], recentSearches: [] };
  }

  // 제목에서 제안
  const titleSuggestions = await db
    .select({ title: memos.title })
    .from(memos)
    .where(
      and(
        eq(memos.userId, userId),
        sql`to_tsvector('korean', ${memos.title}) @@ plainto_tsquery('korean', ${searchQuery})`
      )
    )
    .limit(5);

  // 태그에서 제안
  const tagSuggestions = await db
    .select({ name: tags.name })
    .from(tags)
    .where(
      and(
        eq(tags.userId, userId),
        sql`to_tsvector('korean', ${tags.name}) @@ plainto_tsquery('korean', ${searchQuery})`
      )
    )
    .limit(5);

  // TODO: 최근 검색어는 별도 테이블에서 조회
  const recentSearches: string[] = [];

  return {
    titles: titleSuggestions.map((s) => s.title),
    tags: tagSuggestions.map((s) => s.name),
    recentSearches,
  };
}
