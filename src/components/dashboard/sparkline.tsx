/** Tiny inline-SVG trend line; decorative companion to a number, so it carries a text label. */
export function Sparkline({ data, label, width = 96, height = 32 }: { data: readonly number[]; label: string; width?: number; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = 2
  const x = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2)
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")

  return (
    <svg role="img" aria-label={label} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <path d={d} fill="none" stroke="var(--chart-1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={2.5} fill="var(--chart-1)" />
    </svg>
  )
}
