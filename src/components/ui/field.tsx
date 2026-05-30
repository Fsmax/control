// Общий стиль инпутов/селектов форм (как в существующих формах) + обёртка-метка.
export const fieldClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block space-y-1 text-xs text-muted-foreground">
      <span>
        {label}
        {hint && <span className="ml-1 opacity-70">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
