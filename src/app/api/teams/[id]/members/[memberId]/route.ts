import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

// 팀 멤버 역할 변경
export async function PUT(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: teamId, memberId } = params;
    const { role } = await req.json();

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      );
    }

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

    // 소유자만 역할 변경 가능
    if (membership[0].role !== 'owner') {
      return NextResponse.json(
        { error: '멤버 역할을 변경할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 변경할 멤버 조회
    const targetMember = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .limit(1);

    if (targetMember.length === 0) {
      return NextResponse.json(
        { error: '멤버를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 소유자를 일반 멤버로 변경하려는 경우 확인
    if (targetMember[0].role === 'owner' && role !== 'owner') {
      // 다른 소유자가 있는지 확인
      const otherOwners = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.role, 'owner'),
            sql`${teamMembers.id} != ${memberId}`
          )
        );

      if (otherOwners.length === 0) {
        return NextResponse.json(
          { error: '팀에는 최소 한 명의 소유자가 있어야 합니다.' },
          { status: 400 }
        );
      }
    }

    // 역할 변경
    await db
      .update(teamMembers)
      .set({ role })
      .where(eq(teamMembers.id, memberId));

    return NextResponse.json({
      message: '멤버 역할이 성공적으로 변경되었습니다.',
    });
  } catch (error) {
    console.error('팀 멤버 역할 변경 오류:', error);
    return NextResponse.json(
      { error: '멤버 역할 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 멤버 제거
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: teamId, memberId } = params;

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

    // 제거할 멤버 조회
    const targetMember = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .limit(1);

    if (targetMember.length === 0) {
      return NextResponse.json(
        { error: '멤버를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인
    const currentUserRole = membership[0].role;
    const targetUserRole = targetMember[0].role;

    // 소유자는 자신을 제거할 수 없음
    if (targetMember[0].userId === session.user.id) {
      return NextResponse.json(
        { error: '자신을 팀에서 제거할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 소유자나 관리자만 멤버 제거 가능
    if (!['owner', 'admin'].includes(currentUserRole)) {
      return NextResponse.json(
        { error: '멤버를 제거할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 관리자는 소유자를 제거할 수 없음
    if (currentUserRole === 'admin' && targetUserRole === 'owner') {
      return NextResponse.json(
        { error: '관리자는 소유자를 제거할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 마지막 소유자를 제거하려는 경우 확인
    if (targetUserRole === 'owner') {
      const otherOwners = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.role, 'owner'),
            sql`${teamMembers.id} != ${memberId}`
          )
        );

      if (otherOwners.length === 0) {
        return NextResponse.json(
          { error: '팀에는 최소 한 명의 소유자가 있어야 합니다.' },
          { status: 400 }
        );
      }
    }

    // 멤버 제거
    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    return NextResponse.json({
      message: '팀 멤버가 성공적으로 제거되었습니다.',
    });
  } catch (error) {
    console.error('팀 멤버 제거 오류:', error);
    return NextResponse.json(
      { error: '팀 멤버 제거 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
