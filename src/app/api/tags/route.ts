import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// 태그 목록 조회
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const tagsData = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, session.user.id))
      .orderBy(asc(tags.name));

    return NextResponse.json(tagsData);
  } catch (error) {
    console.error('태그 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '태그 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 태그 생성
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { name, color = '#3b82f6' } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '태그 이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 중복 태그 확인
    const existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.name, name.trim()), eq(tags.userId, session.user.id)),
    });

    if (existingTag) {
      return NextResponse.json(
        { error: '이미 동일한 이름의 태그가 존재합니다.' },
        { status: 400 }
      );
    }

    // 태그 생성
    const tagId = uuidv4();
    await db.insert(tags).values({
      id: tagId,
      name: name.trim(),
      color,
      userId: session.user.id,
    });

    const newTag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
    });

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('태그 생성 오류:', error);
    return NextResponse.json(
      { error: '태그 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
