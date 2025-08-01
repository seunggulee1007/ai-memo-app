import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamMembers, memos, users, tags, memoTags } from '@/lib/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export const runtime = 'nodejs';

// 팀 메모 통계 조회
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
    const period = searchParams.get('period') || '30'; // 기본 30일
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    // 날짜 범위 계산
    let dateFilter = [];
    if (startDate && endDate) {
      dateFilter = [
        gte(memos.createdAt, new Date(startDate)),
        lte(memos.createdAt, new Date(endDate)),
      ];
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      dateFilter = [gte(memos.createdAt, daysAgo)];
    }

    // 기본 통계
    const [{ totalMemos }] = await db
      .select({ totalMemos: sql<number>`count(*)` })
      .from(memos)
      .where(and(eq(memos.teamId, teamId), ...dateFilter));

    // 최근 메모 수 (최근 7일)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const [{ recentMemos }] = await db
      .select({ recentMemos: sql<number>`count(*)` })
      .from(memos)
      .where(and(eq(memos.teamId, teamId), gte(memos.createdAt, recentDate)));

    // 작성자별 메모 수
    const authorStats = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
        memoCount: sql<number>`count(*)`,
      })
      .from(memos)
      .innerJoin(users, eq(memos.userId, users.id))
      .where(and(eq(memos.teamId, teamId), ...dateFilter))
      .groupBy(users.id, users.name, users.email, users.avatar)
      .orderBy(sql`count(*) desc`);

    // 태그별 메모 수
    const tagStats = await db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
        memoCount: sql<number>`count(distinct ${memoTags.memoId})`,
      })
      .from(tags)
      .innerJoin(memoTags, eq(tags.id, memoTags.tagId))
      .innerJoin(memos, eq(memoTags.memoId, memos.id))
      .where(and(eq(memos.teamId, teamId), ...dateFilter))
      .groupBy(tags.id, tags.name, tags.color)
      .orderBy(sql`count(distinct ${memoTags.memoId}) desc`);

    // 일별 메모 생성 통계 (최근 30일)
    const dailyStats = await db
      .select({
        date: sql<string>`date(${memos.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(memos)
      .where(
        and(
          eq(memos.teamId, teamId),
          gte(memos.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(sql`date(${memos.createdAt})`)
      .orderBy(sql`date(${memos.createdAt})`);

    // 가장 활발한 작성자 (최근 7일)
    const topAuthors = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
        memoCount: sql<number>`count(*)`,
      })
      .from(memos)
      .innerJoin(users, eq(memos.userId, users.id))
      .where(
        and(
          eq(memos.teamId, teamId),
          gte(memos.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(users.id, users.name, users.email, users.avatar)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    // 평균 메모 길이
    const [{ avgLength }] = await db
      .select({
        avgLength: sql<number>`avg(length(${memos.content}))`,
      })
      .from(memos)
      .where(and(eq(memos.teamId, teamId), ...dateFilter));

    // 가장 긴 메모
    const longestMemo = await db
      .select({
        id: memos.id,
        title: memos.title,
        content: memos.content,
        length: sql<number>`length(${memos.content})`,
        createdAt: memos.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(memos)
      .innerJoin(users, eq(memos.userId, users.id))
      .where(and(eq(memos.teamId, teamId), ...dateFilter))
      .orderBy(sql`length(${memos.content}) desc`)
      .limit(1);

    return NextResponse.json({
      stats: {
        totalMemos: Number(totalMemos),
        recentMemos: Number(recentMemos),
        avgLength: Number(avgLength) || 0,
        period: parseInt(period),
        dateRange: {
          startDate,
          endDate,
        },
      },
      authorStats,
      tagStats,
      dailyStats,
      topAuthors,
      longestMemo: longestMemo[0] || null,
    });
  } catch (error) {
    console.error('팀 메모 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '메모 통계를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
