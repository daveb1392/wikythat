import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodedQuery}&limit=5&format=json`,
      {
        headers: {
          'User-Agent': 'Wikithat.com/1.0',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();
    const suggestions = data[1] || []; // OpenSearch returns [query, [titles], [descriptions], [urls]]

    return NextResponse.json(suggestions, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return NextResponse.json([]);
  }
}
