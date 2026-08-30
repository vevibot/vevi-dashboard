'use client';

interface Props {
  data: number[];
  color?: string;       // hex or 'auto' (green if up, red if down)
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = 'auto', width = 200, height = 28 }: Props) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Reserve 2px padding top/bottom so the stroke isn't clipped
  const padY = 2;
  const usable = height - padY * 2;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 2) + 1;
      const y = padY + (1 - (v - min) / range) * usable;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const trend = data[data.length - 1] >= data[0] ? 'up' : 'down';
  const strokeColor =
    color === 'auto' ? (trend === 'up' ? '#3ECF8E' : '#F8536B') : color;
  const fillColor = strokeColor + '22';     // subtle area fill

  // Build closed polygon for fill
  const last = (data.length - 1);
  const lastX = ((last) / last) * (width - 2) + 1;
  const fillPath = `${points} ${lastX.toFixed(2)},${height} 1,${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polygon points={fillPath} fill={fillColor} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
