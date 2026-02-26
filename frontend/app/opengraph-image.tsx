import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Wikithat - Compare Wikipedia vs Grokipedia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            display: 'flex',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <span style={{ color: '#2563eb' }}>Wikipedia</span>
          <span style={{ color: '#6b7280' }}>vs</span>
          <span style={{ color: '#9333ea' }}>Grokipedia</span>
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#374151',
            marginBottom: 40,
          }}
        >
          Compare any topic side-by-side
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          wikithat.com
        </div>
      </div>
    ),
    { ...size }
  );
}
