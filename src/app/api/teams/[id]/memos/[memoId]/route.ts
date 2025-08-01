import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamMembers, memos, users, tags, memoTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { canEditMemo, canDeleteMemo } from '@/lib/teamPermissions';

export const runtime = 'nodejs';

// 팀 메모 상세 조회
export async function GET(
  req: Request,
  { params }: { params: { id: string; memoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: teamId, memoId } = params;

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

    // 메모 조회
    const memo = await db
      .select({
        id: memos.id,
        title: memos.title,
        content: memos.content,
        createdAt: memos.createdAt,
        updatedAt: memos.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(memos)
      .innerJoin(users, eq(memos.userId, users.id))
      .where(and(eq(memos.id, memoId), eq(memos.teamId, teamId)))
      .limit(1);

    if (memo.length === 0) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 메모 태그 조회
    const memoTagData = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(tags)
      .innerJoin(memoTags, eq(tags.id, memoTags.tagId))
      .where(eq(memoTags.memoId, memoId));

    const memoWithTags = {
      ...memo[0],
      tags: memoTagData,
    };

    return NextResponse.json({ memo: memoWithTags });
  } catch (error) {
    console.error('팀 메모 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '메모 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 메모 수정
export async function PUT(
  req: Request,
  { params }: { params: { id: string; memoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: teamId, memoId } = params;
    const { title, content, tagIds = [] } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: '제목은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '내용은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 메모 편집 권한 확인
    const canEdit = await canEditMemo(memoId, session.user.id, teamId);
    if (!canEdit) {
      return NextResponse.json(
        { error: '메모를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 메모 존재 확인
    const existingMemo = await db.query.memos.findFirst({
      where: eq(memos.id, memoId),
    });

    if (!existingMemo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 메모 수정 및 태그 업데이트
    await db.transaction(async (tx) => {
      // 메모 수정
      await tx
        .update(memos)
        .set({
          title: title.trim(),
          content: content.trim(),
          updatedAt: new Date(),
        })
        .where(eq(memos.id, memoId));

      // 기존 태그 연결 삭제
      await tx.delete(memoTags).where(eq(memoTags.memoId, memoId));

      // 새로운 태그 연결 추가
      if (tagIds.length > 0) {
        const tagConnections = tagIds.map((tagId: string) => ({
          memoId,
          tagId,
        }));

        await tx.insert(memoTags).values(tagConnections);
      }
    });

    // 수정된 메모 조회
    const updatedMemo = await db.query.memos.findFirst({
      where: eq(memos.id, memoId),
    });

    return NextResponse.json({
      memo: updatedMemo,
      message: '메모가 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('팀 메모 수정 오류:', error);
    return NextResponse.json(
      { error: '메모 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팀 메모 삭제
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; memoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: teamId, memoId } = params;

    // 메모 삭제 권한 확인
    const canDelete = await canDeleteMemo(memoId, session.user.id, teamId);
    if (!canDelete) {
      return NextResponse.json(
        { error: '메모를 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 메모 존재 확인
    const existingMemo = await db.query.memos.findFirst({
      where: eq(memos.id, memoId),
    });

    if (!existingMemo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 메모 삭제 (CASCADE로 인해 관련 태그 연결도 함께 삭제됨)
    await db.delete(memos).where(eq(memos.id, memoId));

    return NextResponse.json({
      message: '메모가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('팀 메모 삭제 오류:', error);
    return NextResponse.json(
      { error: '메모 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
