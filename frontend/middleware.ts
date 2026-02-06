import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Return 410 Gone for old /wiki/ paths from previous owner
  // This tells Google to permanently deindex these URLs faster than 404
  if (request.nextUrl.pathname.startsWith('/wiki/')) {
    return new NextResponse(null, {
      status: 410,
      statusText: 'Gone',
      headers: {
        'Content-Type': 'text/html',
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/wiki/:path*',
  ],
};
