"use client"

import { useEffect } from "react"

// Hook to hide header and footer on specific routes
export const useHideHeaderAndFooter = (pathname: string, routesToHide: string[]) => {
  useEffect(() => {
    const shouldHide = routesToHide.includes(pathname)
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")

    if (header) {
      header.style.display = shouldHide ? "none" : ""
    }
    if (footer) {
      footer.style.display = shouldHide ? "none" : ""
    }

    // Cleanup function to reset styles when the component unmounts or the pathname changes
    return () => {
      if (header) {
        header.style.display = ""
      }
      if (footer) {
        footer.style.display = ""
      }
    }
  }, [pathname, routesToHide])
}
