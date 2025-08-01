import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamMembers, memos, users, tags, memoTags } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';

export const runtime = 'nodejs';

// 팀 메모 검색 및 필터링
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const teamId = params.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const tagIds = searchParams.getAll('tagId');
    const authorId = searchParams.get('authorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const useSemanticSearch = searchParams.get('useSemanticSearch') === 'true';

    // 사용자가 팀 멤버인지 확인
    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { error: '팀에 대한 접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 검색 조건 구성
    const whereConditions = [eq(memos.teamId, teamId)];

    // 텍스트 검색
    if (search.trim()) {
      if (useSemanticSearch) {
        // 의미 검색 (PostgreSQL 전문 검색 사용)
        whereConditions.push(
          sql`to_tsvector('korean', ${memos.title} || ' ' || ${memos.content}) @@ plainto_tsquery('korean', ${search})`
        );
      } else {
        // 일반 텍스트 검색
        whereConditions.push(
          sql`(${memos.title} ILIKE ${`%${search}%`} OR ${memos.content} ILIKE ${`%${search}%`})`
        );
      }
    }

    // 태그 필터
    if (tagIds.length > 0) {
      const memosWithTags = await db
        .select({ memoId: memoTags.memoId })
        .from(memoTags)
        .where(inArray(memoTags.tagId, tagIds))
        .groupBy(memoTags.memoId)
        .having(sql`count(distinct ${memoTags.tagId}) = ${tagIds.length}`);

      const memoIds = memosWithTags.map((m) => m.memoId);
      if (memoIds.length > 0) {
        whereConditions.push(inArray(memos.id, memoIds));
      } else {
        // 태그 조건을 만족하는 메모가 없으면 빈 결과 반환
        return NextResponse.json({
          memos: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }
    }

    // 작성자 필터
    if (authorId) {
      whereConditions.push(eq(memos.userId, authorId));
    }

    // 날짜 범위 필터
    if (startDate) {
      whereConditions.push(sql`${memos.createdAt} >= ${new Date(startDate)}`);
    }
    if (endDate) {
      whereConditions.push(sql`${memos.createdAt} <= ${new Date(endDate)}`);
    }

    // 정렬 조건 구성
    let orderByClause;
    switch (sortBy) {
      case 'title':
        orderByClause =
          sortOrder === 'asc' ? asc(memos.title) : desc(memos.title);
        break;
      case 'createdAt':
        orderByClause =
          sortOrder === 'asc' ? asc(memos.createdAt) : desc(memos.createdAt);
        break;
      case 'relevance':
        if (search.trim() && useSemanticSearch) {
          // 관련성 점수로 정렬
          orderByClause = sql`ts_rank(to_tsvector('korean', ${memos.title} || ' ' || ${memos.content}), plainto_tsquery('korean', ${search})) ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        } else {
          orderByClause =
            sortOrder === 'asc' ? asc(memos.updatedAt) : desc(memos.updatedAt);
        }
        break;
      default:
        orderByClause =
          sortOrder === 'asc' ? asc(memos.updatedAt) : desc(memos.updatedAt);
    }

    // 전체 메모 수 조회
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memos)
      .where(and(...whereConditions));

    // 메모 목록 조회
    const offset = (page - 1) * limit;
    const teamMemos = await db
      .select({
        id: memos.id,
        title: memos.title,
        content: memos.content,
        createdAt: memos.createdAt,
        updatedAt: memos.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
        relevanceScore:
          useSemanticSearch && search.trim()
            ? sql<number>`ts_rank(to_tsvector('korean', ${memos.title} || ' ' || ${memos.content}), plainto_tsquery('korean', ${search}))`
            : sql<number>`0`,
      })
      .from(memos)
      .innerJoin(users, eq(memos.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // 각 메모의 태그 조회
    const memosWithTags = await Promise.all(
      teamMemos.map(async (memo) => {
        const memoTagData = await db
          .select({
            id: tags.id,
            name: tags.name,
            color: tags.color,
          })
          .from(tags)
          .innerJoin(memoTags, eq(tags.id, memoTags.tagId))
          .where(eq(memoTags.memoId, memo.id));

        return {
          ...memo,
          tags: memoTagData,
        };
      })
    );

    const totalPages = Math.ceil(Number(count) / limit);

    return NextResponse.json({
      memos: memosWithTags,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: totalPages,
      },
      searchInfo: {
        query: search,
        useSemanticSearch,
        filters: {
          tagIds,
          authorId,
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error('팀 메모 검색 오류:', error);
    return NextResponse.json(
      { error: '메모 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
