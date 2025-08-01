'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// interface SuggestionItem {
//   text: string;
//   type: 'title' | 'tag' | 'recent';
// }

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '메모 검색...',
  className = '',
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { allSuggestions, loading, error } = useSearchSuggestions(value);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(allSuggestions[selectedIndex].text);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 제안 선택
  const handleSelect = (suggestion: string) => {
    onSelect(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // 입력값 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= 2);
    setSelectedIndex(-1);
  };

  // 포커스 처리
  const handleFocus = () => {
    if (value.length >= 2) {
      setIsOpen(true);
    }
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 제안 아이콘
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'title':
        return '📄';
      case 'tag':
        return '🏷️';
      case 'recent':
        return '🕒';
      default:
        return '🔍';
    }
  };

  // 제안 타입 라벨
  const getSuggestionLabel = (type: string) => {
    switch (type) {
      case 'title':
        return '제목';
      case 'tag':
        return '태그';
      case 'recent':
        return '최근';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
        />
        <div className="absolute right-3 top-2.5">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          ) : (
            <span className="text-gray-400">🔍</span>
          )}
        </div>
      </div>

      {/* 자동완성 드롭다운 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {error && (
            <div className="px-4 py-2 text-sm text-red-600 border-b border-gray-100">
              {error}
            </div>
          )}

          {allSuggestions.length > 0 ? (
            <div className="py-1">
              {allSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  onClick={() => handleSelect(suggestion.text)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                    index === selectedIndex
                      ? 'bg-indigo-50 text-indigo-900'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getSuggestionIcon(suggestion.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {suggestion.text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getSuggestionLabel(suggestion.type)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              검색 제안이 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
