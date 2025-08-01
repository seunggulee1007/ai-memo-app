import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  teams,
  teamMembers,
  memos,
  users,
  tags,
  memoTags,
} from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

// 팀 메모 목록 조회
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
    if (search.trim()) {
      whereConditions.push(
        sql`(${memos.title} ILIKE ${`%${search}%`} OR ${memos.content} ILIKE ${`%${search}%`})`
      );
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
    });
  } catch (error) {
    console.error('팀 메모 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 메모 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 메모 생성
export async function POST(
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
    const { title, content, tagIds = [] } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: '제목은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '내용은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

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

    // 팀이 존재하는지 확인
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 메모 생성
    const memoId = uuidv4();
    await db.insert(memos).values({
      id: memoId,
      title: title.trim(),
      content: content.trim(),
      userId: session.user.id,
      teamId,
    });

    // 태그 연결
    if (tagIds.length > 0) {
      const tagConnections = tagIds.map((tagId: string) => ({
        memoId,
        tagId,
      }));

      await db.insert(memoTags).values(tagConnections);
    }

    // 생성된 메모 조회
    const newMemo = await db.query.memos.findFirst({
      where: eq(memos.id, memoId),
    });

    if (!newMemo) {
      throw new Error('메모 생성 후 조회 실패');
    }

    return NextResponse.json(
      {
        memo: newMemo,
        message: '팀 메모가 성공적으로 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('팀 메모 생성 오류:', error);
    return NextResponse.json(
      { error: '팀 메모 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
