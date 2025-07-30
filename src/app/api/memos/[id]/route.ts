import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos, memoTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// 메모 상세 조회
export async function GET(
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

    const memo = await db.query.memos.findFirst({
      where: and(eq(memos.id, id), eq(memos.userId, session.user.id)),
    });

    if (!memo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 메모에 연결된 태그 조회
    const memoWithTags = await db.query.memos.findFirst({
      where: eq(memos.id, id),
      with: {
        memoTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...memo,
      tags: memoWithTags?.memoTags.map((mt) => mt.tag) || [],
    });
  } catch (error) {
    console.error('메모 조회 오류:', error);
    return NextResponse.json(
      { error: '메모를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 메모 수정
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

    const { title, content, isPublic, tagIds = [] } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 메모 소유권 확인
    const existingMemo = await db.query.memos.findFirst({
      where: and(eq(memos.id, id), eq(memos.userId, session.user.id)),
    });

    if (!existingMemo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 메모 및 태그 관계 업데이트
    await db.transaction(async (tx) => {
      // 메모 업데이트
      await tx
        .update(memos)
        .set({
          title,
          content,
          isPublic,
          updatedAt: new Date(),
        })
        .where(eq(memos.id, id));

      // 기존 태그 관계 삭제
      await tx.delete(memoTags).where(eq(memoTags.memoId, id));

      // 새로운 태그 관계 생성
      if (tagIds.length > 0) {
        await Promise.all(
          tagIds.map((tagId: string) =>
            tx.insert(memoTags).values({
              memoId: id,
              tagId,
            })
          )
        );
      }
    });

    // 업데이트된 메모 조회
    const updatedMemo = await db.query.memos.findFirst({
      where: eq(memos.id, id),
      with: {
        memoTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedMemo,
      tags: updatedMemo?.memoTags.map((mt) => mt.tag) || [],
    });
  } catch (error) {
    console.error('메모 수정 오류:', error);
    return NextResponse.json(
      { error: '메모 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 메모 삭제
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

    // 메모 소유권 확인
    const existingMemo = await db.query.memos.findFirst({
      where: and(eq(memos.id, id), eq(memos.userId, session.user.id)),
    });

    if (!existingMemo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 메모 및 관련 데이터 삭제
    await db.transaction(async (tx) => {
      // 태그 관계 삭제
      await tx.delete(memoTags).where(eq(memoTags.memoId, id));

      // 메모 삭제
      await tx.delete(memos).where(eq(memos.id, id));
    });

    return NextResponse.json({ message: '메모가 삭제되었습니다.' });
  } catch (error) {
    console.error('메모 삭제 오류:', error);
    return NextResponse.json(
      { error: '메모 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
