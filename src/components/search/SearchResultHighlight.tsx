'use client';

interface SearchResultHighlightProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export default function SearchResultHighlight({
  text,
  searchQuery,
  className = '',
}: SearchResultHighlightProps) {
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  const highlightText = (text: string, query: string) => {
    // 검색어를 단어로 분리
    const searchTerms = query
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // 특수문자 이스케이프

    if (searchTerms.length === 0) {
      return text;
    }

    // 모든 검색어를 포함하는 정규식 생성
    const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-200 px-1 rounded font-medium">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return <span className={className}>{highlightText(text, searchQuery)}</span>;
}
