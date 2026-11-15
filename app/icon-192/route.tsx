import { ImageResponse } from 'next/og';
import { appIconMark } from '@/lib/appIcon';

export async function GET() {
  return new ImageResponse(appIconMark(128), { width: 192, height: 192 });
}
