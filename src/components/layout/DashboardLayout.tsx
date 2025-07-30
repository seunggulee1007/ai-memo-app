'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: '📊' },
    { name: '메모 목록', href: '/memos', icon: '📝' },
    { name: '새 메모 작성', href: '/memos/new', icon: '✏️' },
    { name: '태그 관리', href: '/tags', icon: '🏷️' },
    { name: '팀 관리', href: '/teams', icon: '👥' },
    { name: '에디터 테스트', href: '/editor', icon: '🔧' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:transform-none lg:flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-semibold text-gray-900">AI Memo App</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col h-full">
          <nav className="flex-1 mt-8 px-4 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* 사용자 정보 */}
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {session.user?.name?.[0] || 'U'}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user?.email}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-400 hover:text-gray-500"
                  title="로그아웃"
                >
                  🚪
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              ☰
            </button>
            <div className="flex-1 lg:hidden" />
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                프로필
              </Link>
            </div>
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
