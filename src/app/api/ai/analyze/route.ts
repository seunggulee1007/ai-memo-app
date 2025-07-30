import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import anthropic from '@/lib/anthropic';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { memoId, type } = await req.json();

    if (!memoId || !type) {
      return NextResponse.json(
        { error: '메모 ID와 분석 유형이 필요합니다.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (
      !process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key'
    ) {
      return NextResponse.json(
        {
          error:
            'AI 분석을 위한 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
        },
        { status: 503 }
      );
    }

    // 메모 조회
    const memo = await db.query.memos.findFirst({
      where: and(eq(memos.id, memoId), eq(memos.userId, session.user.id)),
    });

    if (!memo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인
    if (memo.userId !== session.user.id) {
      return NextResponse.json(
        { error: '이 메모에 대한 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 분석 유형에 따른 프롬프트 구성
    let prompt = '';
    const systemPrompt =
      '당신은 텍스트 분석 및 개선을 돕는 AI 어시스턴트입니다.';

    switch (type) {
      case 'grammar':
        prompt = `다음 텍스트의 문법과 맞춤법을 검토하고 개선 제안을 제공해주세요. 
        
**원문:**
${memo.content}

**분석 요청:**
1. 문법적 오류나 맞춤법 오류를 찾아서 수정해주세요
2. 더 자연스러운 표현으로 개선할 수 있는 부분을 제안해주세요
3. 수정된 텍스트를 제공해주세요

결과는 다음과 같은 형식으로 제공해주세요:
- **발견된 오류**: [오류 목록]
- **개선 제안**: [제안 사항]
- **수정된 텍스트**: [수정된 내용]`;
        break;

      case 'style':
        prompt = `다음 텍스트의 문체와 표현을 분석하고 더 명확하고 효과적인 표현으로 개선할 수 있는 제안을 제공해주세요.
        
**원문:**
${memo.content}

**분석 요청:**
1. 현재 문체의 특징을 분석해주세요
2. 더 명확하고 효과적인 표현으로 개선할 수 있는 부분을 찾아주세요
3. 개선된 버전을 제안해주세요

결과는 다음과 같은 형식으로 제공해주세요:
- **현재 문체 분석**: [분석 결과]
- **개선 포인트**: [개선할 수 있는 부분들]
- **개선된 텍스트**: [개선된 내용]`;
        break;

      case 'structure':
        prompt = `다음 텍스트의 구조를 분석하고 더 논리적이고 체계적인 구조로 개선할 수 있는 방법을 제안해주세요.
        
**원문:**
${memo.content}

**분석 요청:**
1. 현재 텍스트의 구조적 특징을 분석해주세요
2. 더 논리적이고 체계적인 구조로 개선할 수 있는 방법을 제안해주세요
3. 개선된 구조의 텍스트를 제공해주세요

결과는 다음과 같은 형식으로 제공해주세요:
- **현재 구조 분석**: [구조적 특징]
- **개선 방안**: [구조 개선 제안]
- **개선된 구조**: [개선된 텍스트]`;
        break;

      case 'summary':
        prompt = `다음 텍스트의 핵심 포인트를 추출하여 간결한 요약을 제공해주세요.
        
**원문:**
${memo.content}

**분석 요청:**
1. 텍스트의 주요 내용을 파악해주세요
2. 핵심 포인트들을 추출해주세요
3. 간결하고 명확한 요약을 제공해주세요

결과는 다음과 같은 형식으로 제공해주세요:
- **주요 내용**: [핵심 내용 요약]
- **핵심 포인트**: [주요 포인트들]
- **요약**: [간결한 요약]`;
        break;

      default:
        return NextResponse.json(
          {
            error:
              '지원하지 않는 분석 유형입니다. (grammar, style, structure, summary 중 선택)',
          },
          { status: 400 }
        );
    }

    // Anthropic Claude API 호출
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt,
    });

    const suggestion =
      response.content[0].type === 'text'
        ? response.content[0].text
        : '분석 결과를 생성할 수 없습니다.';

    // AI 제안을 메모의 content 필드에 임시 저장 (실제로는 별도 테이블이 필요하지만 현재는 간단히 처리)
    const suggestionId = uuidv4();

    // 분석 결과를 메모에 임시 저장 (실제 구현에서는 별도 테이블 사용 권장)
    await db
      .update(memos)
      .set({
        content: `${memo.content}\n\n--- AI 분석 결과 (${type}) ---\n\n${suggestion}`,
        updatedAt: new Date(),
      })
      .where(eq(memos.id, memoId));

    return NextResponse.json({
      id: suggestionId,
      memoId,
      type,
      content: suggestion,
      applied: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('AI 분석 오류:', error);

    // API 키 관련 오류인지 확인
    if (
      error instanceof Error &&
      error.message.includes('authentication_error')
    ) {
      return NextResponse.json(
        { error: 'AI 분석 서비스 인증에 실패했습니다. API 키를 확인해주세요.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
