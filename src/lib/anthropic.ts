import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;

// AI analysis types
export type AIAnalysisType = 'grammar' | 'style' | 'structure' | 'summary';

// AI analysis function
export async function analyzeMemo(content: string, type: AIAnalysisType) {
  let prompt = '';

  switch (type) {
    case 'grammar':
      prompt = `다음 텍스트의 문법과 맞춤법을 검토하고 개선 제안을 제공해주세요. 원문을 유지하면서 문법적 오류를 수정해주세요:\n\n${content}`;
      break;
    case 'style':
      prompt = `다음 텍스트의 문체와 표현을 분석하고 더 명확하고 효과적인 표현으로 개선할 수 있는 제안을 제공해주세요:\n\n${content}`;
      break;
    case 'structure':
      prompt = `다음 텍스트의 구조를 분석하고 더 논리적이고 체계적인 구조로 개선할 수 있는 방법을 제안해주세요:\n\n${content}`;
      break;
    case 'summary':
      prompt = `다음 텍스트의 핵심 포인트를 추출하여 간결한 요약을 제공해주세요:\n\n${content}`;
      break;
    default:
      throw new Error('지원하지 않는 분석 유형입니다.');
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('예상치 못한 응답 형식입니다.');
  } catch (error) {
    console.error('AI 분석 오류:', error);
    throw new Error('AI 분석 중 오류가 발생했습니다.');
  }
}
