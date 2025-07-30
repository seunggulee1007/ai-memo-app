'use client';

import { useState, useEffect } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface TagManagerProps {
  onTagSelect?: (tagIds: string[]) => void;
  selectedTags?: string[];
  showCreateButton?: boolean;
}

const predefinedColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#6366f1', // indigo
];

export default function TagManager({
  onTagSelect,
  selectedTags = [],
  showCreateButton = true,
}: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(predefinedColors[0]);
  const [creating, setCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');

      if (response.ok) {
        const data = await response.json();
        setTags(data);
      } else {
        setError('태그를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('태그 조회 오류:', error);
      setError('태그를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTagName.trim()) {
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags([...tags, newTag]);
        setNewTagName('');
        setNewTagColor(predefinedColors[0]);
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '태그 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 생성 오류:', error);
      setError('태그 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTag || !editingName.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName.trim(),
          color: editingColor,
        }),
      });

      if (response.ok) {
        const updatedTag = await response.json();
        setTags(
          tags.map((tag) => (tag.id === editingTag.id ? updatedTag : tag))
        );
        setEditingTag(null);
        setEditingName('');
        setEditingColor('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '태그 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 수정 오류:', error);
      setError('태그 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('정말로 이 태그를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags(tags.filter((tag) => tag.id !== tagId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || '태그 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 삭제 오류:', error);
      setError('태그 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    onTagSelect?.(newSelectedTags);
  };

  const startEditing = (tag: Tag) => {
    setEditingTag(tag);
    setEditingName(tag.name);
    setEditingColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditingName('');
    setEditingColor('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="text-center py-4">
          <div className="text-gray-500">태그를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">태그 관리</h3>
        {showCreateButton && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm font-medium"
          >
            {showCreateForm ? '취소' : '새 태그'}
          </button>
        )}
      </div>

      {/* 새 태그 생성 폼 */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateTag}
          className="mb-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="태그 이름"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="flex space-x-1">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    newTagColor === color
                      ? 'border-gray-800'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {creating ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      )}

      {/* 태그 목록 */}
      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            {editingTag?.id === tag.id ? (
              // 편집 모드
              <form
                onSubmit={handleUpdateTag}
                className="flex items-center space-x-3 flex-1"
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex space-x-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingColor(color)}
                      className={`w-5 h-5 rounded-full border ${
                        editingColor === color
                          ? 'border-gray-800'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  취소
                </button>
              </form>
            ) : (
              // 표시 모드
              <>
                <div className="flex items-center space-x-3 flex-1">
                  {onTagSelect && (
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  )}
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {tag.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEditing(tag)}
                    className="text-indigo-600 hover:text-indigo-500 text-sm"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-red-600 hover:text-red-500 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          아직 생성된 태그가 없습니다.
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
