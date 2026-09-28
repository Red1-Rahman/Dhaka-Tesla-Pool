import Image from "next/image"

interface PaisaIconProps {
  size?: number
  className?: string
  priority?: boolean
}

export function PaisaIcon({
  size = 16,
  className,
  priority = false,
}: PaisaIconProps) {
  return (
    <Image
      src="/icons/shapla-E8FF59.svg"
      alt="Paisa"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  )
}
