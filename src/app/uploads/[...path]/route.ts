import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.path || !Array.isArray(resolvedParams.path) || resolvedParams.path.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Decode each path segment to handle URL-encoded filenames
    const decodedSegments = resolvedParams.path.map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const filePath = path.resolve(uploadsDir, ...decodedSegments);

    // Security check to prevent directory traversal
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    // Guess content type from extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.avif') contentType = 'image/avif';
    else if (ext === '.ico') contentType = 'image/x-icon';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
