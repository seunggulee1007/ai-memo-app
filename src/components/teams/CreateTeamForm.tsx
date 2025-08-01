'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, X } from 'lucide-react';

interface CreateTeamFormProps {
  onCancel?: () => void;
  onSuccess?: (team: unknown) => void;
}

export default function CreateTeamForm({
  onCancel,
  onSuccess,
}: CreateTeamFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('팀 이름은 필수 입력 항목입니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '팀 생성에 실패했습니다.');
      }

      // 성공 처리
      if (onSuccess) {
        onSuccess(data.team);
      } else {
        router.push(`/teams/${data.team.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '팀 생성 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 에러 메시지 초기화
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">새 팀 생성</h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            팀 이름 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="팀 이름을 입력하세요"
            maxLength={50}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.name.length}/50
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            팀 설명
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="팀에 대한 설명을 입력하세요 (선택사항)"
            maxLength={200}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/200
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isLoading}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? '생성 중...' : '팀 생성'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          팀 생성 시 알아두세요
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 팀을 생성하면 자동으로 소유자 역할이 부여됩니다.</li>
          <li>• 팀 이름은 중복될 수 없습니다.</li>
          <li>• 팀 생성 후 멤버를 초대할 수 있습니다.</li>
          <li>• 팀 메모는 팀 멤버들만 접근할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
