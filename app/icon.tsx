import { ImageResponse } from 'next/og';
import { appIconMark } from '@/lib/appIcon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(appIconMark(20), size);
}
