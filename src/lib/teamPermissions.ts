import { db } from '@/lib/db';
import { teamMembers, memos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamPermission {
  canViewTeam: boolean;
  canEditTeam: boolean;
  canDeleteTeam: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeMemberRoles: boolean;
  canCreateMemos: boolean;
  canEditMemos: boolean;
  canDeleteMemos: boolean;
}

/**
 * 사용자의 팀 멤버십 및 역할 조회
 */
export async function getUserTeamMembership(teamId: string, userId: string) {
  const membership = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  return membership[0] || null;
}

/**
 * 사용자의 팀 권한 계산
 */
export function calculateTeamPermissions(
  role: TeamRole | null
): TeamPermission {
  if (!role) {
    return {
      canViewTeam: false,
      canEditTeam: false,
      canDeleteTeam: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeMemberRoles: false,
      canCreateMemos: false,
      canEditMemos: false,
      canDeleteMemos: false,
    };
  }

  switch (role) {
    case 'owner':
      return {
        canViewTeam: true,
        canEditTeam: true,
        canDeleteTeam: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeMemberRoles: true,
        canCreateMemos: true,
        canEditMemos: true,
        canDeleteMemos: true,
      };

    case 'admin':
      return {
        canViewTeam: true,
        canEditTeam: true,
        canDeleteTeam: false,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeMemberRoles: false,
        canCreateMemos: true,
        canEditMemos: true,
        canDeleteMemos: true,
      };

    case 'member':
      return {
        canViewTeam: true,
        canEditTeam: false,
        canDeleteTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeMemberRoles: false,
        canCreateMemos: true,
        canEditMemos: false,
        canDeleteMemos: false,
      };

    default:
      return {
        canViewTeam: false,
        canEditTeam: false,
        canDeleteTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeMemberRoles: false,
        canCreateMemos: false,
        canEditMemos: false,
        canDeleteMemos: false,
      };
  }
}

/**
 * 특정 권한 확인
 */
export function hasPermission(
  permissions: TeamPermission,
  permission: keyof TeamPermission
): boolean {
  return permissions[permission];
}

/**
 * 역할 기반 권한 확인 헬퍼 함수들
 */
export function canManageTeam(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin'].includes(role);
}

export function canManageMembers(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin'].includes(role);
}

export function canChangeRoles(role: TeamRole | null): boolean {
  if (!role) return false;
  return role === 'owner';
}

export function canDeleteTeam(role: TeamRole | null): boolean {
  if (!role) return false;
  return role === 'owner';
}

export function canInviteMembers(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin'].includes(role);
}

export function canRemoveMembers(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin'].includes(role);
}

export function canCreateMemos(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin', 'member'].includes(role);
}

export function canEditMemos(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin'].includes(role);
}

export function canDeleteMemos(role: TeamRole | null): boolean {
  if (!role) return false;
  return ['owner', 'admin'].includes(role);
}

/**
 * 메모 소유자 확인
 */
export async function isMemoOwner(
  memoId: string,
  userId: string
): Promise<boolean> {
  const memo = await db.query.memos.findFirst({
    where: eq(memos.id, memoId),
  });

  return memo?.userId === userId;
}

/**
 * 메모 편집 권한 확인 (소유자이거나 팀 관리자)
 */
export async function canEditMemo(
  memoId: string,
  userId: string,
  teamId: string
): Promise<boolean> {
  // 메모 소유자인지 확인
  const isOwner = await isMemoOwner(memoId, userId);
  if (isOwner) return true;

  // 팀 관리자인지 확인
  const membership = await getUserTeamMembership(teamId, userId);
  if (!membership) return false;

  return canEditMemos(membership.role as TeamRole);
}

/**
 * 메모 삭제 권한 확인 (소유자이거나 팀 관리자)
 */
export async function canDeleteMemo(
  memoId: string,
  userId: string,
  teamId: string
): Promise<boolean> {
  // 메모 소유자인지 확인
  const isOwner = await isMemoOwner(memoId, userId);
  if (isOwner) return true;

  // 팀 관리자인지 확인
  const membership = await getUserTeamMembership(teamId, userId);
  if (!membership) return false;

  return canDeleteMemos(membership.role as TeamRole);
}

/**
 * 역할 변경 권한 확인
 */
export function canChangeRole(
  currentUserRole: TeamRole | null,
  targetUserRole: TeamRole,
  newRole: TeamRole
): boolean {
  if (!currentUserRole) return false;

  // 소유자만 역할 변경 가능
  if (currentUserRole !== 'owner') return false;

  // 소유자를 일반 멤버로 변경하려는 경우 특별 처리
  if (targetUserRole === 'owner' && newRole !== 'owner') {
    // 다른 소유자가 있는지 확인하는 로직은 별도로 처리
    return true;
  }

  return true;
}

/**
 * 멤버 제거 권한 확인
 */
export function canRemoveMember(
  currentUserRole: TeamRole | null,
  targetUserRole: TeamRole,
  isSelf: boolean
): boolean {
  if (!currentUserRole) return false;

  // 자신을 제거할 수 없음
  if (isSelf) return false;

  // 소유자나 관리자만 멤버 제거 가능
  if (!['owner', 'admin'].includes(currentUserRole)) return false;

  // 관리자는 소유자를 제거할 수 없음
  if (currentUserRole === 'admin' && targetUserRole === 'owner') return false;

  return true;
}
