'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const stats = [
    { name: '총 메모 수', value: '0', href: '/memos', icon: '📝' },
    { name: '태그 수', value: '0', href: '/tags', icon: '🏷️' },
    { name: '팀 수', value: '0', href: '/teams', icon: '👥' },
  ];

  const quickActions = [
    {
      name: '새 메모 작성',
      href: '/memos/new',
      icon: '✏️',
      color: 'bg-blue-500',
    },
    { name: '태그 관리', href: '/tags', icon: '🏷️', color: 'bg-green-500' },
    { name: '팀 생성', href: '/teams', icon: '👥', color: 'bg-purple-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 환영 메시지 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            안녕하세요, {session.user?.name}님! 👋
          </h1>
          <p className="text-gray-600">
            AI Memo App을 사용하여 메모를 작성하고 관리하세요.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            빠른 액션
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
              >
                <div
                  className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white text-lg`}
                >
                  {action.icon}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {action.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            최근 활동
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-500">아직 활동이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              첫 번째 메모를 작성해보세요!
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
