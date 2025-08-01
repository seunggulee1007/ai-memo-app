import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserInvitations } from '@/lib/teamInvitation';

export const runtime = 'nodejs';

// 사용자의 초대 목록 조회
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자의 초대 목록 조회
    const invitations = await getUserInvitations(session.user.email!);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('사용자 초대 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '초대 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
