interface TicketIconProps {
  className?: string
  size?: number
}

export function TicketIcon({ className = "", size = 20 }: TicketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V9C19.8954 9 19 9.89543 19 11C19 12.1046 19.8954 13 21 13V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V13C4.10457 13 5 12.1046 5 11C5 9.89543 4.10457 9 3 9V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" strokeLinecap="round" />
    </svg>
  )
}
