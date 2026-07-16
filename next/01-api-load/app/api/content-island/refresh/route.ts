// app/api/content-island/refresh/route.ts  ->  POST /api/content-island/refresh
import { NextResponse } from 'next/server';
import { contentIslandClient } from '@/lib/content-island';

export async function POST(request: Request) {
  if (request.headers.get('x-refresh-secret') !== process.env.REFRESH_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const result = await contentIslandClient.refreshSnapshot();
  return NextResponse.json(result); // { status: 'updated' | 'unchanged', meta }
}
