'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TagManager from '@/components/tags/TagManager';

export default function TagsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">태그 관리</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 태그 관리 */}
          <div>
            <TagManager showCreateButton={true} />
          </div>

          {/* 사용 가이드 */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              태그 사용 가이드
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-indigo-600 font-medium">•</span>
                <span>태그를 사용하여 메모를 분류하고 정리할 수 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-indigo-600 font-medium">•</span>
                <span>각 태그는 고유한 색상을 가질 수 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-indigo-600 font-medium">•</span>
                <span>메모 작성 시 태그를 선택하여 연결할 수 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-indigo-600 font-medium">•</span>
                <span>태그별로 메모를 필터링하여 찾을 수 있습니다.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-indigo-600 font-medium">•</span>
                <span>
                  태그를 삭제하면 해당 태그가 연결된 모든 메모에서도 제거됩니다.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
