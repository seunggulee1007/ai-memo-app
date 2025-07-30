import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos, memoTags, tags } from '@/lib/db/schema';
import { eq, and, like, or, desc, sql, gte, lte, asc } from 'drizzle-orm';

export const runtime = 'nodejs';

// 메모 목록 조회 (고급 검색 포함)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const tagIds = searchParams.getAll('tagId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // 기본 메모 조회 (검색 조건 포함)
    const whereConditions = [eq(memos.userId, session.user.id)];

    // 텍스트 검색
    if (search) {
      whereConditions.push(
        or(
          like(memos.title, `%${search}%`),
          like(memos.content, `%${search}%`)
        )!
      );
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

    // 메모 조회
    let memosData = await db
      .select()
      .from(memos)
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(skip);

    // 태그 필터링 (메모 조회 후 필터링)
    if (tagIds.length > 0) {
      const memosWithTags = await Promise.all(
        memosData.map(async (memo) => {
          const tagsData = await db
            .select()
            .from(tags)
            .innerJoin(
              memoTags,
              and(eq(memoTags.tagId, tags.id), eq(memoTags.memoId, memo.id))
            );

          return {
            ...memo,
            tags: tagsData.map(({ tags }) => tags),
          };
        })
      );

      // 지정된 태그를 모두 가지고 있는 메모만 필터링
      memosData = memosWithTags.filter((memo) => {
        const memoTagIds = memo.tags.map((tag: { id: string }) => tag.id);
        return tagIds.every((tagId) => memoTagIds.includes(tagId));
      });
    } else {
      // 태그 필터링이 없는 경우 기본 태그 조회
      memosData = await Promise.all(
        memosData.map(async (memo) => {
          const tagsData = await db
            .select()
            .from(tags)
            .innerJoin(
              memoTags,
              and(eq(memoTags.tagId, tags.id), eq(memoTags.memoId, memo.id))
            );

          return {
            ...memo,
            tags: tagsData.map(({ tags }) => tags),
          };
        })
      );
    }

    // 총 개수 조회 (태그 필터링 적용)
    let totalCount = memosData.length;

    // 태그 필터링이 적용된 경우 정확한 개수를 계산하기 위해 다시 조회
    if (tagIds.length > 0) {
      const allMemosWithTags = await Promise.all(
        (
          await db
            .select()
            .from(memos)
            .where(and(...whereConditions))
        ).map(async (memo) => {
          const tagsData = await db
            .select()
            .from(tags)
            .innerJoin(
              memoTags,
              and(eq(memoTags.tagId, tags.id), eq(memoTags.memoId, memo.id))
            );

          return {
            ...memo,
            tags: tagsData.map(({ tags }) => tags),
          };
        })
      );

      totalCount = allMemosWithTags.filter((memo) => {
        const memoTagIds = memo.tags.map((tag: { id: string }) => tag.id);
        return tagIds.every((tagId) => memoTagIds.includes(tagId));
      }).length;
    } else {
      // 태그 필터링이 없는 경우 기존 방식으로 개수 조회
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(memos)
        .where(and(...whereConditions));

      totalCount = countResult[0]?.count || 0;
    }

    return NextResponse.json({
      memos: memosData,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('메모 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '메모 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 메모 생성
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { title, content, isPublic = false, tagIds = [] } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 메모 및 태그 관계 생성
    const newMemo = await db.transaction(async (tx) => {
      // 메모 생성
      const result = await tx
        .insert(memos)
        .values({
          title: title as string,
          content: content as string,
          isPublic,
          userId: session.user!.id,
        })
        .returning();

      const memo = result[0];

      // 태그 연결
      if (tagIds.length > 0) {
        await Promise.all(
          tagIds.map((tagId: string) =>
            tx.insert(memoTags).values({
              memoId: memo.id,
              tagId,
            })
          )
        );
      }

      return memo;
    });

    return NextResponse.json(newMemo, { status: 201 });
  } catch (error) {
    console.error('메모 생성 오류:', error);
    return NextResponse.json(
      { error: '메모 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
