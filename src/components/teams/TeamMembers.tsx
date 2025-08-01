'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Crown, Shield, User, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface TeamMembersProps {
  teamId: string;
  currentUserRole: string;
  onMemberUpdate?: () => void;
}

export default function TeamMembers({
  teamId,
  currentUserRole,
  onMemberUpdate,
}: TeamMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teams/${teamId}/members`);

      if (!response.ok) {
        throw new Error('멤버 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteData.email.trim()) {
      setInviteError('이메일은 필수 입력 항목입니다.');
      return;
    }

    setIsInviting(true);
    setInviteError(null);

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '멤버 초대에 실패했습니다.');
      }

      // 성공 처리
      setInviteData({ email: '', role: 'member' });
      setShowInviteForm(false);
      fetchMembers();
      onMemberUpdate?.();
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : '멤버 초대 중 오류가 발생했습니다.'
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '역할 변경에 실패했습니다.');
      }

      fetchMembers();
      onMemberUpdate?.();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : '역할 변경 중 오류가 발생했습니다.'
      );
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`정말로 ${memberName}님을 팀에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '멤버 제거에 실패했습니다.');
      }

      fetchMembers();
      onMemberUpdate?.();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : '멤버 제거 중 오류가 발생했습니다.'
      );
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return '소유자';
      case 'admin':
        return '관리자';
      case 'member':
        return '멤버';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole);
  const canChangeRoles = currentUserRole === 'owner';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchMembers}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">팀 멤버</h3>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            멤버 초대
          </button>
        )}
      </div>

      {showInviteForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            새 멤버 초대
          </h4>
          <form onSubmit={handleInviteMember} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="초대할 사용자의 이메일"
                disabled={isInviting}
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                역할
              </label>
              <select
                id="role"
                value={inviteData.role}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isInviting}
              >
                <option value="member">멤버</option>
                <option value="admin">관리자</option>
                {currentUserRole === 'owner' && (
                  <option value="owner">소유자</option>
                )}
              </select>
            </div>
            {inviteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{inviteError}</p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isInviting}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isInviting || !inviteData.email.trim()}
              >
                {isInviting ? '초대 중...' : '초대하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={member.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {member.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {member.user.name}
                  </p>
                  {getRoleIcon(member.role)}
                </div>
                <p className="text-sm text-gray-500">{member.user.email}</p>
                <p className="text-xs text-gray-400">
                  {new Date(member.joinedAt).toLocaleDateString('ko-KR')} 가입
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                  member.role
                )}`}
              >
                {getRoleDisplayName(member.role)}
              </span>

              {canManageMembers && (
                <div className="relative">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value)
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={!canChangeRoles || member.role === 'owner'}
                  >
                    <option value="member">멤버</option>
                    <option value="admin">관리자</option>
                    {canChangeRoles && <option value="owner">소유자</option>}
                  </select>
                </div>
              )}

              {canManageMembers && member.role !== 'owner' && (
                <button
                  onClick={() =>
                    handleRemoveMember(member.id, member.user.name)
                  }
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="멤버 제거"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            멤버가 없습니다
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            팀에 멤버를 초대하여 협업을 시작해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
