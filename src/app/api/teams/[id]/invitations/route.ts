import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamMembers, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createTeamInvitation, getTeamInvitations } from '@/lib/teamInvitation';

export const runtime = 'nodejs';

// 팀 초대 목록 조회
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

    // 소유자나 관리자만 초대 목록 조회 가능
    if (!['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json(
        { error: '초대 목록을 조회할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 팀 초대 목록 조회
    const invitations = await getTeamInvitations(teamId);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('팀 초대 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 초대 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 초대 생성
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

    if (!['owner', 'admin', 'member'].includes(role)) {
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

    // 소유자나 관리자만 초대 생성 가능
    if (!['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json(
        { error: '팀 초대를 생성할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 관리자는 소유자 역할로 초대할 수 없음
    if (membership[0].role === 'admin' && role === 'owner') {
      return NextResponse.json(
        { error: '관리자는 소유자 역할로 초대할 수 없습니다.' },
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

    // 초대 생성
    const invitation = await createTeamInvitation({
      teamId,
      email: email.trim(),
      role,
      invitedBy: session.user.id,
    });

    return NextResponse.json(
      {
        invitation,
        message: '팀 초대가 성공적으로 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('팀 초대 생성 오류:', error);

    if (error instanceof Error) {
      if (error.message.includes('이미 대기 중인 초대')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: '팀 초대 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
