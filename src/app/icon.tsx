import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e112a 50%, #020617 100%)',
          borderRadius: '7px',
          border: '1px solid rgba(244, 63, 94, 0.5)',
          position: 'relative',
        }}
      >
        {/* Play triangle */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 4.5C6 3.6 7 3 7.8 3.5L19 10.5C19.7 11 19.7 12 19 12.5L7.8 19.5C7 20 6 19.4 6 18.5V4.5Z"
            fill="url(#playG)"
          />
          {/* Lightning pulse */}
          <path
            d="M13.5 3L8 11.5H12.5L10 20L17.5 10H12.5L13.5 3Z"
            fill="#fef08a"
          />
          <defs>
            <linearGradient id="playG" x1="6" y1="3" x2="19" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
