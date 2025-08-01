import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchMemosWithFullText, SearchFilters } from '@/lib/search';
import { db } from '@/lib/db';
import { memos, memoTags } from '@/lib/db/schema';

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

    // 새로운 전문 검색 함수 사용
    const searchFilters: SearchFilters = {
      search: search || undefined,
      tagIds,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy: sortBy as SearchFilters['sortBy'],
      sortOrder: sortOrder as SearchFilters['sortOrder'],
      limit,
      offset: skip,
    };

    const { results: memosData, total: totalCount } =
      await searchMemosWithFullText(session.user.id, searchFilters);

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
          title,
          content,
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
