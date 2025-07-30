import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos, memoTags, tags } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 태그 소유권 확인
    const tag = await db.query.tags.findFirst({
      where: and(eq(tags.id, id), eq(tags.userId, session.user.id)),
    });

    if (!tag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // 태그에 연결된 메모 조회
    const memosWithTags = await db.query.memos.findMany({
      where: and(
        eq(memos.userId, session.user.id),
        search ? eq(memos.title, search) : undefined
      ),
      with: {
        memoTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(memos.updatedAt)],
      limit,
      offset,
    });

    // 해당 태그가 포함된 메모만 필터링
    const filteredMemos = memosWithTags.filter((memo) =>
      memo.memoTags.some((mt) => mt.tagId === id)
    );

    // 전체 개수 조회 (필터링된 결과)
    const totalCount = await db
      .select({ count: count() })
      .from(memos)
      .innerJoin(memoTags, eq(memos.id, memoTags.memoId))
      .where(
        and(
          eq(memos.userId, session.user.id),
          eq(memoTags.tagId, id),
          search ? eq(memos.title, search) : undefined
        )
      );

    return NextResponse.json({
      memos: filteredMemos,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
      tag,
    });
  } catch (error) {
    console.error('태그별 메모 조회 오류:', error);
    return NextResponse.json(
      { error: '메모를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
