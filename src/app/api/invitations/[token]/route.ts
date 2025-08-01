import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getInvitationWithDetails,
  acceptInvitation,
  declineInvitation,
} from '@/lib/teamInvitation';

export const runtime = 'nodejs';

// 초대 상세 정보 조회
export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // 초대 정보 조회
    const invitation = await getInvitationWithDetails(token);

    if (!invitation) {
      return NextResponse.json(
        { error: '유효하지 않은 초대입니다.' },
        { status: 404 }
      );
    }

    // 만료된 초대인지 확인
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '만료된 초대입니다.' },
        { status: 410 }
      );
    }

    // 이미 처리된 초대인지 확인
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 초대입니다.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('초대 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '초대 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 초대 수락
export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = params.token;
    const { action } = await req.json();

    if (action === 'accept') {
      // 초대 수락
      await acceptInvitation(token, session.user.id);

      return NextResponse.json({
        message: '팀 초대를 성공적으로 수락했습니다.',
      });
    } else if (action === 'decline') {
      // 초대 거절
      await declineInvitation(token);

      return NextResponse.json({
        message: '팀 초대를 거절했습니다.',
      });
    } else {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('초대 처리 오류:', error);

    if (error instanceof Error) {
      if (error.message.includes('유효하지 않은 초대')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('이미 처리된 초대')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('만료된 초대')) {
        return NextResponse.json({ error: error.message }, { status: 410 });
      }
      if (error.message.includes('이미 팀 멤버')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: '초대 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
