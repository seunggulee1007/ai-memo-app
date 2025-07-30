'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect } from 'react';
import EditorToolbar from './EditorToolbar';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autofocus?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  autofocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    autofocus,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 자동 저장 로직
  const autoSave = useCallback(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      // 여기서 자동 저장 API 호출
      console.log('자동 저장:', currentContent);
    }
  }, [editor]);

  useEffect(() => {
    const interval = setInterval(autoSave, 5000); // 5초마다 자동 저장
    return () => clearInterval(interval);
  }, [autoSave]);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.url) {
          editor.chain().focus().setImage({ src: data.url }).run();
        }
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
      }
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />
      <EditorContent
        editor={editor}
        className="p-4 min-h-[300px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
}
