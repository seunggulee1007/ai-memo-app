import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teams, teamMembers, users, memos } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// 팀 목록 조회
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자가 속한 팀 조회
    const userTeams = await db
      .select({
        team: teams,
        memberRole: teamMembers.role,
        memberJoinedAt: teamMembers.joinedAt,
      })
      .from(teams)
      .innerJoin(
        teamMembers,
        and(
          eq(teamMembers.teamId, teams.id),
          eq(teamMembers.userId, session.user.id)
        )
      );

    // 각 팀의 멤버 및 메모 수 조회
    const teamsWithDetails = await Promise.all(
      userTeams.map(async ({ team, memberRole, memberJoinedAt }) => {
        // 팀 멤버 조회
        const members = await db
          .select({
            id: teamMembers.id,
            role: teamMembers.role,
            joinedAt: teamMembers.joinedAt,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
              avatar: users.avatar,
            },
          })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(eq(teamMembers.teamId, team.id));

        // 팀 메모 수 조회
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(memos)
          .where(eq(memos.teamId, team.id));

        return {
          ...team,
          members,
          memoCount: Number(count),
          currentUserRole: memberRole,
          currentUserJoinedAt: memberJoinedAt,
        };
      })
    );

    return NextResponse.json({ teams: teamsWithDetails });
  } catch (error) {
    console.error('팀 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 생성
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { name, description = '' } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '팀 이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 팀 이름 중복 확인
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, name.trim()))
      .limit(1);

    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 팀 이름입니다.' },
        { status: 409 }
      );
    }

    // 트랜잭션으로 팀 및 멤버 생성
    const teamId = uuidv4();

    await db.transaction(async (tx) => {
      // 팀 생성
      await tx.insert(teams).values({
        id: teamId,
        name: name.trim(),
        description: description.trim(),
      });

      // 생성자를 팀 소유자로 추가
      await tx.insert(teamMembers).values({
        teamId,
        userId: session.user!.id,
        role: 'owner',
      });
    });

    // 생성된 팀 정보 조회
    const newTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!newTeam) {
      throw new Error('팀 생성 후 조회 실패');
    }

    return NextResponse.json(
      {
        team: newTeam,
        message: '팀이 성공적으로 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('팀 생성 오류:', error);
    return NextResponse.json(
      { error: '팀 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
