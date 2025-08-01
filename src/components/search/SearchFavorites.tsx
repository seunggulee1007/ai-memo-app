'use client';

import { useState, useEffect } from 'react';
import { SearchFavoritesManager, SearchFavorite } from '@/lib/searchFavorites';

interface SearchFavoritesProps {
  onSelectFavorite: (favorite: SearchFavorite) => void;
  currentQuery?: string;
  currentFilters?: SearchFavorite['filters'];
}

export default function SearchFavorites({
  onSelectFavorite,
  currentQuery,
  currentFilters,
}: SearchFavoritesProps) {
  const [favorites, setFavorites] = useState<SearchFavorite[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [newFavoriteDescription, setNewFavoriteDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // 즐겨찾기 로드
  useEffect(() => {
    const loadFavorites = () => {
      const favs = SearchFavoritesManager.getFavorites();
      setFavorites(favs);
    };

    loadFavorites();
  }, []);

  // 즐겨찾기 추가
  const handleAddFavorite = () => {
    if (!newFavoriteName.trim() || !currentQuery) return;

    const id = SearchFavoritesManager.addFavorite(
      newFavoriteName.trim(),
      currentQuery,
      currentFilters || {
        tagIds: [],
        startDate: '',
        endDate: '',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        useSemanticSearch: false,
      },
      newFavoriteDescription.trim() || undefined
    );

    if (id) {
      setFavorites(SearchFavoritesManager.getFavorites());
      setNewFavoriteName('');
      setNewFavoriteDescription('');
      setShowAddForm(false);
    }
  };

  // 즐겨찾기 사용
  const handleUseFavorite = (favorite: SearchFavorite) => {
    SearchFavoritesManager.useFavorite(favorite.id);
    setFavorites(SearchFavoritesManager.getFavorites());
    onSelectFavorite(favorite);
  };

  // 즐겨찾기 수정
  const handleEditFavorite = (id: string) => {
    const favorite = favorites.find((f) => f.id === id);
    if (!favorite) return;

    setEditingId(id);
    setEditName(favorite.name);
    setEditDescription(favorite.description || '');
  };

  // 즐겨찾기 수정 저장
  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;

    const success = SearchFavoritesManager.updateFavorite(editingId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });

    if (success) {
      setFavorites(SearchFavoritesManager.getFavorites());
      setEditingId(null);
      setEditName('');
      setEditDescription('');
    }
  };

  // 즐겨찾기 삭제
  const handleDeleteFavorite = (id: string) => {
    if (confirm('이 즐겨찾기를 삭제하시겠습니까?')) {
      SearchFavoritesManager.removeFavorite(id);
      setFavorites(SearchFavoritesManager.getFavorites());
    }
  };

  // 즐겨찾기 전체 삭제
  const handleClearAll = () => {
    if (confirm('모든 즐겨찾기를 삭제하시겠습니까?')) {
      SearchFavoritesManager.clearFavorites();
      setFavorites([]);
    }
  };

  if (favorites.length === 0 && !showAddForm) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500 mb-4">
          <div className="text-2xl mb-2">⭐</div>
          <p>아직 즐겨찾기가 없습니다</p>
        </div>
        {currentQuery && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            현재 검색을 즐겨찾기에 추가
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">검색 즐겨찾기</h3>
        <div className="flex space-x-2">
          {currentQuery && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
            >
              추가
            </button>
          )}
          {favorites.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 즐겨찾기 추가 폼 */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <input
                type="text"
                value={newFavoriteName}
                onChange={(e) => setNewFavoriteName(e.target.value)}
                placeholder="즐겨찾기 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명 (선택)
              </label>
              <input
                type="text"
                value={newFavoriteDescription}
                onChange={(e) => setNewFavoriteDescription(e.target.value)}
                placeholder="즐겨찾기에 대한 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddFavorite}
                disabled={!newFavoriteName.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewFavoriteName('');
                  setNewFavoriteDescription('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 즐겨찾기 목록 */}
      <div className="space-y-2">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            {editingId === favorite.id ? (
              // 수정 모드
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              // 표시 모드
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {favorite.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {favorite.useCount}회 사용
                      </span>
                    </div>
                    {favorite.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {favorite.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      "{favorite.query}"
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleUseFavorite(favorite)}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    >
                      사용
                    </button>
                    <button
                      onClick={() => handleEditFavorite(favorite.id)}
                      className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteFavorite(favorite.id)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
