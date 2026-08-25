import { NextRequest, NextResponse } from 'next/server';
import { put, head, list, getDownloadUrl } from '@vercel/blob';

const PATHNAME = 'state.json';

/**
 * PUT /api/state — upload state to Vercel Blob
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

    const blob = await put(PATHNAME, body, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('Blob PUT error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blob upload failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/state — download state from Vercel Blob
 */
export async function GET() {
  try {
    // Find latest blob with our pathname
    const listed = await list({ prefix: PATHNAME, limit: 1 });
    if (!listed.blobs.length) {
      return NextResponse.json({ error: 'No state yet' }, { status: 404 });
    }

    const downloadUrl = getDownloadUrl(listed.blobs[0].url);
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch blob content' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Blob GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blob download failed' },
      { status: 500 }
    );
  }
}