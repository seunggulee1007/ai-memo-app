import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teams, teamMembers, users, memos } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

// 팀 상세 조회
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

    // 팀 정보 조회
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
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
      .where(eq(teamMembers.teamId, teamId));

    // 팀 메모 수 조회
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memos)
      .where(eq(memos.teamId, teamId));

    return NextResponse.json({
      team: {
        ...team,
        members,
        memoCount: Number(count),
        currentUserRole: membership[0].role,
      },
    });
  } catch (error) {
    console.error('팀 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 수정
export async function PUT(
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
    const { name, description } = await req.json();

    // 사용자의 팀 멤버십 및 권한 확인
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

    // 소유자나 관리자만 팀 정보 수정 가능
    if (!['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json(
        { error: '팀 정보를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 팀 이름 중복 확인 (자신의 팀 제외)
    if (name && name.trim()) {
      const existingTeam = await db
        .select()
        .from(teams)
        .where(and(eq(teams.name, name.trim()), sql`${teams.id} != ${teamId}`))
        .limit(1);

      if (existingTeam.length > 0) {
        return NextResponse.json(
          { error: '이미 존재하는 팀 이름입니다.' },
          { status: 409 }
        );
      }
    }

    // 팀 정보 업데이트
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    updateData.updatedAt = new Date();

    await db.update(teams).set(updateData).where(eq(teams.id, teamId));

    // 업데이트된 팀 정보 조회
    const updatedTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    return NextResponse.json({
      team: updatedTeam,
      message: '팀 정보가 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('팀 수정 오류:', error);
    return NextResponse.json(
      { error: '팀 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 삭제
export async function DELETE(
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

    // 사용자의 팀 멤버십 및 권한 확인
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

    // 소유자만 팀 삭제 가능
    if (membership[0].role !== 'owner') {
      return NextResponse.json(
        { error: '팀을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 팀 삭제 (CASCADE로 인해 관련 데이터도 함께 삭제됨)
    await db.delete(teams).where(eq(teams.id, teamId));

    return NextResponse.json({
      message: '팀이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('팀 삭제 오류:', error);
    return NextResponse.json(
      { error: '팀 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
