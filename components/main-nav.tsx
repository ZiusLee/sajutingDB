"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MainNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className={cn(
                "hover:text-foreground/80 transition-colors",
                pathname === "/" ? "text-foreground" : "text-foreground/60",
              )}
              onClick={() => setOpen(false)}
            >
              사주계산
            </Link>
            <Link
              href="/about"
              className={cn(
                "hover:text-foreground/80 transition-colors",
                pathname === "/about" ? "text-foreground" : "text-foreground/60",
              )}
              onClick={() => setOpen(false)}
            >
              사주핑 스토리
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
