'use client';

import { Editor } from '@tiptap/react';
import { useRef } from 'react';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => void;
}

export default function EditorToolbar({
  editor,
  onImageUpload,
}: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 텍스트 스타일 */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bold') ? 'bg-gray-200' : ''
        }`}
        title="굵게"
      >
        <strong className="text-sm font-bold">B</strong>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('italic') ? 'bg-gray-200' : ''
        }`}
        title="기울임"
      >
        <em className="text-sm italic">I</em>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('strike') ? 'bg-gray-200' : ''
        }`}
        title="취소선"
      >
        <span className="text-sm line-through">S</span>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* 제목 스타일 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
        }`}
        title="제목 1"
      >
        H1
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
        }`}
        title="제목 2"
      >
        H2
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
        }`}
        title="제목 3"
      >
        H3
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* 목록 */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bulletList') ? 'bg-gray-200' : ''
        }`}
        title="글머리 기호 목록"
      >
        <span className="text-sm">•</span>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('orderedList') ? 'bg-gray-200' : ''
        }`}
        title="번호 매기기 목록"
      >
        <span className="text-sm">1.</span>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* 인용구 */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('blockquote') ? 'bg-gray-200' : ''
        }`}
        title="인용구"
      >
        <span className="text-sm">"</span>
      </button>

      {/* 코드 블록 */}
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('codeBlock') ? 'bg-gray-200' : ''
        }`}
        title="코드 블록"
      >
        <span className="text-sm font-mono">{'<>'}</span>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* 이미지 업로드 */}
      <button
        onClick={handleImageClick}
        className="p-2 rounded hover:bg-gray-200"
        title="이미지 삽입"
      >
        <span className="text-sm">📷</span>
      </button>

      {/* 링크 */}
      <button
        onClick={() => {
          const url = window.prompt('URL을 입력하세요:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('link') ? 'bg-gray-200' : ''
        }`}
        title="링크 삽입"
      >
        <span className="text-sm">🔗</span>
      </button>
    </div>
  );
}
