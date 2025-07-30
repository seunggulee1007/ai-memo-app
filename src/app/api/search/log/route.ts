import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

// 검색 로그 기록
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { query, searchType, resultCount } = await req.json();

    if (!query || !searchType) {
      return NextResponse.json(
        { error: '검색어와 검색 유형이 필요합니다.' },
        { status: 400 }
      );
    }

    // 검색 로그 저장
    await db.execute(sql`
      INSERT INTO search_logs (user_id, query, search_type, result_count)
      VALUES (${session.user.id}, ${query}, ${searchType}, ${resultCount || 0})
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('검색 로그 저장 오류:', error);
    return NextResponse.json(
      { error: '검색 로그 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 인기 검색어 조회
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // 인기 검색어 조회
    const popularSearches = await db.execute(sql`
      SELECT 
        query,
        COUNT(*) as search_count,
        AVG(result_count) as avg_results,
        MAX(created_at) as last_searched
      FROM search_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT ${limit}
    `);

    return NextResponse.json({
      popularSearches: popularSearches,
    });
  } catch (error) {
    console.error('인기 검색어 조회 오류:', error);
    return NextResponse.json(
      { error: '인기 검색어 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
