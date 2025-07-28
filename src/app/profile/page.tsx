'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name);
        setAvatar(data.avatar || '');
      } else {
        setError('프로필을 불러올 수 없습니다.');
      }
    } catch {
      setError('프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('프로필이 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
        fetchProfile(); // 프로필 다시 불러오기
      } else {
        setError(data.error || '프로필 업데이트 중 오류가 발생했습니다.');
      }
    } catch {
      setError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Memo App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900"
              >
                대시보드
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">프로필</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  편집
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="avatar"
                    className="block text-sm font-medium text-gray-700"
                  >
                    아바타 URL (선택사항)
                  </label>
                  <input
                    type="url"
                    id="avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {isLoading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setName(profile?.name || '');
                      setAvatar(profile?.avatar || '');
                      setError('');
                      setSuccess('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{profile?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    이메일
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
                </div>

                {profile?.avatar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      아바타
                    </label>
                    <img
                      src={profile.avatar}
                      alt="프로필 이미지"
                      className="mt-1 w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    가입일
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    마지막 업데이트
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.updatedAt
                      ? new Date(profile.updatedAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
