"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function RootPage() {
  const { isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated) {
    redirect("/signin")
  }
  redirect(currentUser.role === "DRIVER" ? "/dashboard" : "/request")
}
