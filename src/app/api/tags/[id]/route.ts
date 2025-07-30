import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags, memoTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// 태그 수정
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { name, color } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '태그 이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 태그 소유권 확인
    const existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.id, id), eq(tags.userId, session.user.id)),
    });

    if (!existingTag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 동일한 이름의 다른 태그가 있는지 확인
    const duplicateTag = await db.query.tags.findFirst({
      where: and(
        eq(tags.name, name.trim()),
        eq(tags.userId, session.user.id),
        eq(tags.id, id) // 현재 태그는 제외
      ),
    });

    if (duplicateTag) {
      return NextResponse.json(
        { error: '이미 동일한 이름의 태그가 존재합니다.' },
        { status: 400 }
      );
    }

    // 태그 업데이트
    await db
      .update(tags)
      .set({
        name: name.trim(),
        color: color || existingTag.color,
        updatedAt: new Date(),
      })
      .where(eq(tags.id, id));

    const updatedTag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('태그 수정 오류:', error);
    return NextResponse.json(
      { error: '태그 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 태그 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 태그 소유권 확인
    const existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.id, id), eq(tags.userId, session.user.id)),
    });

    if (!existingTag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 태그 및 관련 데이터 삭제
    await db.transaction(async (tx) => {
      // 메모-태그 관계 삭제
      await tx.delete(memoTags).where(eq(memoTags.tagId, id));

      // 태그 삭제
      await tx.delete(tags).where(eq(tags.id, id));
    });

    return NextResponse.json({ message: '태그가 삭제되었습니다.' });
  } catch (error) {
    console.error('태그 삭제 오류:', error);
    return NextResponse.json(
      { error: '태그 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
