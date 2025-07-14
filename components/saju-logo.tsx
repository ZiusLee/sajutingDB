interface SajuLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SajuLogo({ className = "", size = "md" }: SajuLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return <div className={`font-bold text-purple-600 ${sizeClasses[size]} ${className}`}>🔮 사주핑</div>
}

export default SajuLogo
