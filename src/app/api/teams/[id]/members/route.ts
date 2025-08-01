import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// 팀 멤버 목록 조회
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

    // 팀 멤버 목록 조회
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
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(teamMembers.joinedAt);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('팀 멤버 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 멤버 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 멤버 추가 (초대)
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
    const { email, role = 'member' } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: '이메일은 필수 입력 항목입니다.' },
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

    // 소유자나 관리자만 멤버 추가 가능
    if (!['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json(
        { error: '멤버를 추가할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 초대할 사용자 조회
    const invitedUser = await db.query.users.findFirst({
      where: eq(users.email, email.trim()),
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: '해당 이메일로 가입된 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 팀 멤버인지 확인
    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, invitedUser.id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: '이미 팀 멤버인 사용자입니다.' },
        { status: 409 }
      );
    }

    // 팀 멤버 추가
    await db.insert(teamMembers).values({
      teamId,
      userId: invitedUser.id,
      role,
    });

    return NextResponse.json({
      message: '팀 멤버가 성공적으로 추가되었습니다.',
      member: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
        avatar: invitedUser.avatar,
        role,
      },
    });
  } catch (error) {
    console.error('팀 멤버 추가 오류:', error);
    return NextResponse.json(
      { error: '팀 멤버 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
