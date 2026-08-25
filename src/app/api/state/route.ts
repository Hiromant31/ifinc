import { NextRequest, NextResponse } from 'next/server';
import { put, get } from '@vercel/blob';

const PATHNAME = 'state.json';

// никогда не выполнять роут во время сборки
export const dynamic = 'force-dynamic';

/**
 * PUT /api/state — записать состояние в приватный Blob store.
 * Файл создаётся при первой записи и перезаписывается дальше.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    if (!body) {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 });
    }
    try {
      JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    await put(PATHNAME, body, {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Blob PUT error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blob upload failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/state — прочитать состояние из приватного Blob store.
 * Файла нет → 404 (клиент считает облако пустым и заливает локальные данные).
 */
export async function GET() {
  try {
    const result = await get(PATHNAME, {
      access: 'private',
      useCache: false, // всегда свежая версия, без кэша CDN
    });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'No state yet' }, { status: 404 });
    }

    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    // BlobNotFoundError тоже приходит ошибкой — это норма для пустого хранилища
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found') || msg.includes('NotFound')) {
      return NextResponse.json({ error: 'No state yet' }, { status: 404 });
    }
    console.error('Blob GET error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}