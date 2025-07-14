import Link from "next/link"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  return (
    <nav className={className}>
      <ul className="flex items-center space-x-6">
        <li>
          <Link
            href="/"
            className="font-medium transition-colors hover:text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground"
          >
            홈
          </Link>
        </li>
        <li>
          <Link
            href="/tarot"
            className="font-medium transition-colors hover:text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground"
          >
            타로 카드
          </Link>
        </li>
        <li>
          <Link
            href="/about"
            className="font-medium transition-colors hover:text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground"
          >
            About
          </Link>
        </li>
      </ul>
    </nav>
  )
}
