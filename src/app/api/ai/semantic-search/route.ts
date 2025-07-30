import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import anthropic from '@/lib/anthropic';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (
      !process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key'
    ) {
      return NextResponse.json(
        { error: 'AI 의미 검색을 위한 API 키가 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    // 사용자의 모든 메모 가져오기
    const userMemos = await db
      .select({
        id: memos.id,
        title: memos.title,
        content: memos.content,
        updatedAt: memos.updatedAt,
      })
      .from(memos)
      .where(eq(memos.userId, session.user.id));

    if (userMemos.length === 0) {
      return NextResponse.json({
        results: [],
        message: '검색할 메모가 없습니다.',
      });
    }

    // Claude를 사용하여 의미 검색 수행
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `다음은 사용자의 메모 목록입니다. 검색어 "${query}"와 의미적으로 가장 관련성이 높은 메모를 찾아주세요. 각 메모에 대해 관련성 점수(0-100)를 매겨서 JSON 형식으로 반환해주세요. 메모 목록:\n\n${userMemos
            .map(
              (memo) =>
                `ID: ${memo.id}\n제목: ${memo.title}\n내용: ${memo.content.substring(
                  0,
                  500
                )}${memo.content.length > 500 ? '...' : ''}\n---\n`
            )
            .join('\n')}`,
        },
      ],
      system:
        '당신은 텍스트 검색 및 관련성 평가를 돕는 AI 어시스턴트입니다. 사용자의 검색어와 메모 내용의 의미적 관련성을 평가하여 JSON 형식으로 결과를 반환해주세요. 응답은 다음과 같은 형식이어야 합니다: {"memoId1": score1, "memoId2": score2, ...}',
    });

    // Claude 응답 파싱
    const resultContent = response.content[0];

    // JSON 추출 (코드 블록이나 다른 텍스트가 포함된 경우 처리)
    let results;
    try {
      if (resultContent.type === 'text') {
        // JSON 부분만 추출
        const jsonMatch = resultContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다.');
        }
      } else {
        throw new Error('예상치 못한 응답 형식입니다.');
      }
    } catch (error) {
      console.error('의미 검색 결과 파싱 오류:', error);
      return NextResponse.json(
        { error: 'AI 검색 결과를 처리하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 결과 정렬 및 반환
    const sortedResults = Object.entries(results)
      .map(([id, score]) => ({
        memo: userMemos.find((memo) => memo.id === id),
        score: Number(score),
      }))
      .filter((item) => item.memo) // 유효한 메모만 포함
      .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
      .slice(0, limit); // 상위 결과만 반환

    return NextResponse.json({
      results: sortedResults,
      query,
      totalFound: sortedResults.length,
    });
  } catch (error) {
    console.error('의미 검색 오류:', error);

    // API 키 관련 오류인지 확인
    if (
      error instanceof Error &&
      error.message.includes('authentication_error')
    ) {
      return NextResponse.json(
        { error: 'AI 검색 서비스 인증에 실패했습니다. API 키를 확인해주세요.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '의미 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
