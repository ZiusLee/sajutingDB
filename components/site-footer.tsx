"use client"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between space-y-4 py-6 md:flex-row md:space-y-0">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} 사주핑. All rights reserved.</p>
      </div>
    </footer>
  )
}
