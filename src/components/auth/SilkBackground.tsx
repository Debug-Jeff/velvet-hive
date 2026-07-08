export default function SilkBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-1/4 -top-1/4 size-[70%] animate-[silk-drift-1_18s_ease-in-out_infinite] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--brand-primary-light), transparent 20%), transparent 70%)' }}
      />
      <div
        className="absolute -right-1/4 top-1/3 size-[60%] animate-[silk-drift-2_22s_ease-in-out_infinite] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, color-mix(in oklch, white, transparent 60%), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-20%] left-1/4 size-[55%] animate-[silk-drift-3_26s_ease-in-out_infinite] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--brand-primary-tint), transparent 30%), transparent 70%)' }}
      />
    </div>
  )
}
