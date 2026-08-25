'use client';

interface Segment {
  frac: number;
  f: number;
  name: string;
  amt: number;
}

const FILLS = [
  { svg: '#242A20', css: '#242A20' },
  { svg: '#D2694A', css: '#D2694A' },
  { svg: 'url(#pat-ink)', css: 'repeating-linear-gradient(90deg,#242A20 0 1.4px,transparent 1.4px 5px)' },
  { svg: 'url(#pat-acc)', css: 'repeating-linear-gradient(90deg,#D2694A 0 1.4px,transparent 1.4px 5px)' },
  { svg: 'rgba(36,42,32,.55)', css: 'rgba(36,42,32,.55)' },
  { svg: 'url(#pat-dim)', css: 'repeating-linear-gradient(90deg,rgba(36,42,32,.55) 0 1.4px,transparent 1.4px 5px)' },
  { svg: '#F2E8DA', css: '#F2E8DA' },
  { svg: 'url(#pat-cream)', css: 'repeating-linear-gradient(90deg,#F2E8DA 0 1.4px,transparent 1.4px 5px)' }
];

const COLORS = ['#242A20', '#D2694A', 'rgba(36,42,32,.55)', '#F2E8DA'];

export default function RingChart({ segments }: { segments: Segment[] }) {
  if (segments.length === 0) {
    return (
      <svg viewBox="0 0 200 200" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(36,42,32,.18)" strokeWidth="26" />
      </svg>
    );
  }

  const R = 80;
  const C = 2 * Math.PI * R;
  const strokeWidth = 26;
  let offset = 0;

  const rings = segments.map((seg, i) => {
    const len = seg.frac * C;
    if (len <= 0) return null;
    const fill = COLORS[i % COLORS.length];
    const dash = `${len} ${C - len}`;
    const rot = -90;
    const el = (
      <circle
        key={i}
        cx="100"
        cy="100"
        r={String(R)}
        fill="none"
        stroke={fill}
        strokeWidth={String(strokeWidth)}
        strokeDasharray={dash}
        strokeDashoffset={String(-offset)}
        transform={`rotate(${rot} 100 100)`}
      />
    );
    offset += len;
    return el;
  });

  return (
    <svg viewBox="0 0 200 200" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <circle cx="100" cy="100" r={String(R)} fill="none" stroke="rgba(36,42,32,.18)" strokeWidth={String(strokeWidth)} strokeDasharray={`1 5`} />
      {rings}
    </svg>
  );
}
