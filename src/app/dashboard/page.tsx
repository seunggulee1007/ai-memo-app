'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
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
              <span className="text-gray-700">
                안녕하세요, {session.user?.name}님!
              </span>
              <a
                href="/profile"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                프로필
              </a>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                대시보드에 오신 것을 환영합니다!
              </h2>
              <p className="text-gray-600 mb-4">
                AI Memo App을 사용하여 메모를 작성하고 관리하세요.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  사용자 ID: {session.user?.id}
                </p>
                <p className="text-sm text-gray-500">
                  이메일: {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
