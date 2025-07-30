import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
  strongDelimiter: '**',
});

// 코드 블록에 언어 지정을 위한 규칙 추가
turndownService.addRule('codeBlock', {
  filter: function (node) {
    return !!(
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    );
  },
  replacement: function (content, node) {
    const code = node.firstChild as HTMLElement;
    const className = code.getAttribute('class') || '';
    const language = className.replace('language-', '');

    return '\n```' + language + '\n' + code.textContent + '\n```\n';
  },
});

// 이미지 처리 규칙
turndownService.addRule('images', {
  filter: 'img',
  replacement: function (content, node) {
    const img = node as HTMLImageElement;
    const alt = img.alt || '';
    const src = img.src || '';

    return `![${alt}](${src})`;
  },
});

/**
 * HTML을 마크다운으로 변환
 */
export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

/**
 * 마크다운을 HTML로 변환 (간단한 변환)
 */
export function markdownToHtml(markdown: string): string {
  return (
    markdown
      // 제목
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 굵게
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // 기울임
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // 취소선
      .replace(/~~(.*)~~/gim, '<del>$1</del>')
      // 링크
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      // 이미지
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />')
      // 코드 블록
      .replace(
        /```(\w+)?\n([\s\S]*?)\n```/gim,
        '<pre><code class="language-$1">$2</code></pre>'
      )
      // 인라인 코드
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // 인용구
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // 순서 있는 목록
      .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
      // 순서 없는 목록
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      // 줄바꿈
      .replace(/\n/gim, '<br />')
  );
}
