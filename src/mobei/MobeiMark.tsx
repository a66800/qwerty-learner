import { useId } from 'react'

/** MOBEI mountain mark (same paths as mobei.win's Logo), gold foil gradient, 40×32 grid. */
export default function MobeiMark({ height = 40, className = '' }: { height?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={(height * 40) / 32} height={height} viewBox="0 0 40 32" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EED9AA" />
          <stop offset=".55" stopColor="#D4B273" />
          <stop offset="1" stopColor="#A7854B" />
        </linearGradient>
      </defs>
      <path d="M3 28 12 14 17.2 22.1M12.5 28 24 8 35.5 28" fill="none" stroke={`url(#${id})`} strokeWidth="3.2" strokeLinejoin="miter" />
      <path d="M19.6 28 24 20.4 28.4 28Z" fill={`url(#${id})`} />
    </svg>
  )
}
