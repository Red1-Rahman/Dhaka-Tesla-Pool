import { PaisaIcon } from "@/components/ui/paisa-icon"

interface PaisaAmountProps {
  value: number
  iconSize?: number
  className?: string
}

export function PaisaAmount({
  value,
  iconSize = 16,
  className,
}: PaisaAmountProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className ?? ""}`}
    >
      <PaisaIcon size={iconSize} />
      <span>{value.toLocaleString("en-BD")}</span>
    </span>
  )
}
