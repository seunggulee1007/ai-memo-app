import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSearchSuggestions } from '@/lib/search';

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
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({
        suggestions: {
          titles: [],
          tags: [],
          recentSearches: [],
        },
      });
    }

    const suggestions = await getSearchSuggestions(session.user.id, query);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error('검색 제안 오류:', error);
    return NextResponse.json(
      { error: '검색 제안을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
