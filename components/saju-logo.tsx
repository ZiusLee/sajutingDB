interface SajuLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SajuLogo({ className = "", size = "md" }: SajuLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex-shrink-0" />
      <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>SAJUPING</span>
    </div>
  )
}

export default SajuLogo
