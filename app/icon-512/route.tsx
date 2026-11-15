import { ImageResponse } from 'next/og';
import { appIconMark } from '@/lib/appIcon';

export async function GET() {
  return new ImageResponse(appIconMark(340), { width: 512, height: 512 });
}
