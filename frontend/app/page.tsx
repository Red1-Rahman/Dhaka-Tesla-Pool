"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function RootPage() {
  const { isAuthenticated, isLoading, currentUser } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated || !currentUser) {
    redirect("/signin")
  }

  redirect(
    currentUser.role === "DRIVER"
      ? "/dashboard"
      : "/request",
  )
}
