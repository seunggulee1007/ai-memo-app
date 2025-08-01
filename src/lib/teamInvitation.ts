import { db } from '@/lib/db';
import { teamInvitations, teamMembers, teams, users } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import crypto from 'crypto';

export interface CreateInvitationData {
  teamId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy: string;
}

export interface InvitationWithDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  team: {
    id: string;
    name: string;
    description: string | null;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * 초대 토큰 생성
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 초대 만료 시간 생성 (7일 후)
 */
export function generateExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

/**
 * 팀 초대 생성
 */
export async function createTeamInvitation(data: CreateInvitationData) {
  const token = generateInvitationToken();
  const expiresAt = generateExpirationDate();

  // 기존 초대가 있는지 확인
  const existingInvitation = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.teamId, data.teamId),
        eq(teamInvitations.email, data.email),
        eq(teamInvitations.status, 'pending')
      )
    )
    .limit(1);

  if (existingInvitation.length > 0) {
    throw new Error('이미 대기 중인 초대가 있습니다.');
  }

  // 초대 생성
  const [invitation] = await db
    .insert(teamInvitations)
    .values({
      teamId: data.teamId,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      token,
      expiresAt,
    })
    .returning();

  return invitation;
}

/**
 * 초대 토큰으로 초대 조회
 */
export async function getInvitationByToken(token: string) {
  const invitation = await db
    .select({
      id: teamInvitations.id,
      teamId: teamInvitations.teamId,
      email: teamInvitations.email,
      role: teamInvitations.role,
      status: teamInvitations.status,
      expiresAt: teamInvitations.expiresAt,
      createdAt: teamInvitations.createdAt,
      invitedBy: teamInvitations.invitedBy,
    })
    .from(teamInvitations)
    .where(eq(teamInvitations.token, token))
    .limit(1);

  return invitation[0] || null;
}

/**
 * 초대 상세 정보 조회 (팀 및 초대자 정보 포함)
 */
export async function getInvitationWithDetails(
  token: string
): Promise<InvitationWithDetails | null> {
  const invitation = await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      role: teamInvitations.role,
      status: teamInvitations.status,
      expiresAt: teamInvitations.expiresAt,
      createdAt: teamInvitations.createdAt,
      team: {
        id: teams.id,
        name: teams.name,
        description: teams.description,
      },
      invitedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teamInvitations)
    .innerJoin(teams, eq(teamInvitations.teamId, teams.id))
    .innerJoin(users, eq(teamInvitations.invitedBy, users.id))
    .where(eq(teamInvitations.token, token))
    .limit(1);

  return invitation[0] || null;
}

/**
 * 초대 수락
 */
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error('유효하지 않은 초대입니다.');
  }

  if (invitation.status !== 'pending') {
    throw new Error('이미 처리된 초대입니다.');
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('만료된 초대입니다.');
  }

  // 이미 팀 멤버인지 확인
  const existingMember = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, invitation.teamId),
        eq(teamMembers.userId, userId)
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    throw new Error('이미 팀 멤버입니다.');
  }

  // 트랜잭션으로 초대 수락 및 멤버 추가
  await db.transaction(async (tx) => {
    // 초대 상태 업데이트
    await tx
      .update(teamInvitations)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(teamInvitations.id, invitation.id));

    // 팀 멤버 추가
    await tx.insert(teamMembers).values({
      teamId: invitation.teamId,
      userId,
      role: invitation.role,
    });
  });

  return { success: true };
}

/**
 * 초대 거절
 */
export async function declineInvitation(token: string) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error('유효하지 않은 초대입니다.');
  }

  if (invitation.status !== 'pending') {
    throw new Error('이미 처리된 초대입니다.');
  }

  await db
    .update(teamInvitations)
    .set({ status: 'declined', updatedAt: new Date() })
    .where(eq(teamInvitations.id, invitation.id));

  return { success: true };
}

/**
 * 팀의 초대 목록 조회
 */
export async function getTeamInvitations(teamId: string) {
  const invitations = await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      role: teamInvitations.role,
      status: teamInvitations.status,
      expiresAt: teamInvitations.expiresAt,
      createdAt: teamInvitations.createdAt,
      invitedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teamInvitations)
    .innerJoin(users, eq(teamInvitations.invitedBy, users.id))
    .where(eq(teamInvitations.teamId, teamId))
    .orderBy(teamInvitations.createdAt);

  return invitations;
}

/**
 * 사용자의 초대 목록 조회
 */
export async function getUserInvitations(email: string) {
  const invitations = await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      role: teamInvitations.role,
      status: teamInvitations.status,
      expiresAt: teamInvitations.expiresAt,
      createdAt: teamInvitations.createdAt,
      team: {
        id: teams.id,
        name: teams.name,
        description: teams.description,
      },
      invitedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teamInvitations)
    .innerJoin(teams, eq(teamInvitations.teamId, teams.id))
    .innerJoin(users, eq(teamInvitations.invitedBy, users.id))
    .where(eq(teamInvitations.email, email))
    .orderBy(teamInvitations.createdAt);

  return invitations;
}

/**
 * 만료된 초대 정리
 */
export async function cleanupExpiredInvitations() {
  const expiredInvitations = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.status, 'pending'),
        lt(teamInvitations.expiresAt, new Date())
      )
    );

  if (expiredInvitations.length > 0) {
    await db
      .update(teamInvitations)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(teamInvitations.status, 'pending'),
          lt(teamInvitations.expiresAt, new Date())
        )
      );
  }

  return expiredInvitations.length;
}

/**
 * 초대 취소
 */
export async function cancelInvitation(invitationId: string, userId: string) {
  const invitation = await db
    .select()
    .from(teamInvitations)
    .where(eq(teamInvitations.id, invitationId))
    .limit(1);

  if (invitation.length === 0) {
    throw new Error('초대를 찾을 수 없습니다.');
  }

  if (invitation[0].invitedBy !== userId) {
    throw new Error('초대를 취소할 권한이 없습니다.');
  }

  if (invitation[0].status !== 'pending') {
    throw new Error('이미 처리된 초대는 취소할 수 없습니다.');
  }

  await db
    .update(teamInvitations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(teamInvitations.id, invitationId));

  return { success: true };
}
