"use client"

import { useEffect } from "react"
import { SafeArea } from "@capacitor-community/safe-area"

export default function SafeAreaSetup() {
  useEffect(() => {
    const applySafeArea = async () => {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches

      await SafeArea.enable({
        config: {
          customColorsForSystemBars: true,
          statusBarColor: isDark ? "#000000" : "#ffffff",
          statusBarContent: isDark ? "light" : "dark",
          navigationBarColor: isDark ? "#000000" : "#ffffff",
          navigationBarContent: isDark ? "light" : "dark",
        },
      })
    }

    applySafeArea()

    // Optional: listen for theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applySafeArea()
    mediaQuery.addEventListener("change", handler)

    return () => {
      mediaQuery.removeEventListener("change", handler)
    }
  }, [])

  return null
}
