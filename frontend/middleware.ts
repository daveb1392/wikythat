import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slugify } from '@/lib/slugify';

export function middleware(request: NextRequest) {
  // Redirect old URL format to new slugified format
  // e.g. /compare/Elon%20Musk → /compare/elon-musk
  if (request.nextUrl.pathname.startsWith('/compare/')) {
    const topic = request.nextUrl.pathname.slice('/compare/'.length);
    if (topic) {
      const slugified = slugify(decodeURIComponent(topic));
      if (topic !== slugified) {
        const url = request.nextUrl.clone();
        url.pathname = `/compare/${slugified}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
