import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// 프로필 조회
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(sql`${users.id} = ${session.user.id}`)
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 프로필 수정
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { name, avatar } = await req.json();

    // 입력값 검증
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 사용자 정보 업데이트
    await db
      .update(users)
      .set({
        name: name.trim(),
        avatar: avatar || null,
        updatedAt: new Date(),
      })
      .where(sql`${users.id} = ${session.user.id}`);

    return NextResponse.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    return NextResponse.json(
      { error: '프로필 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
