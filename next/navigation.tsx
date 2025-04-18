"use client"

export function useRouter() {
  return {
    push: (url: string) => {
      if (typeof window !== "undefined") {
        window.location.href = url
      } else {
        console.log("Attempted to push to:", url)
      }
    },
    back: () => {
      if (typeof window !== "undefined") {
        window.history.back()
      } else {
        console.log("Attempted to go back")
      }
    },
    prefetch: (url: string) => {
      console.log("Prefetching:", url)
    },
    replace: (url: string) => {
      if (typeof window !== "undefined") {
        window.location.replace(url)
      } else {
        console.log("Attempted to replace with:", url)
      }
    },
  }
}

export function usePathname() {
  if (typeof window !== "undefined") {
    return window.location.pathname
  }
  return "/"
}

export function useSearchParams() {
  if (typeof window === "undefined") {
    return {
      get: (name: string) => null,
      has: (name: string) => false,
      toString: () => "",
    }
  }

  return {
    get: (name: string) => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get(name)
    },
    has: (name: string) => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.has(name)
    },
    toString: () => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.toString()
    },
  }
}
