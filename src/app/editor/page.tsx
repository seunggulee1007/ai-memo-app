'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { htmlToMarkdown } from '@/lib/markdown';

export default function EditorPage() {
  const [content, setContent] = useState(
    '<h1>안녕하세요!</h1><p>리치 텍스트 에디터를 테스트해보세요.</p>'
  );
  const [markdown, setMarkdown] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // HTML을 마크다운으로 변환
    const markdownContent = htmlToMarkdown(newContent);
    setMarkdown(markdownContent);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          리치 텍스트 에디터 테스트
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">에디터</h2>
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              placeholder="내용을 입력하세요..."
              autofocus={true}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">마크다운 변환 결과</h2>
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
              <pre className="whitespace-pre-wrap text-sm">{markdown}</pre>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">HTML 출력</h2>
          <div className="border rounded-lg p-4 bg-gray-50">
            <pre className="whitespace-pre-wrap text-sm overflow-auto">
              {content}
            </pre>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
