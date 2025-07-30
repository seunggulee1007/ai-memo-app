import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 입력값 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${email}`)
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 사용자 생성
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
