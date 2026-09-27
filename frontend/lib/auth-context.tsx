"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { CAST } from "@/lib/mock-data"
import type { CastMember } from "@/types/api"

interface AuthContextValue {
  currentUser: CastMember
  isAuthenticated: boolean
  signInAs: (name: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// prototype-only: holds which cast member is "signed in" so the demo-account
// switcher (Auth screen, Wallet screen) has one shared source of truth
// instead of separate local state per page.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  const [activeName, setActiveName] = useState<string>("Nusrat")

  const value = useMemo<AuthContextValue>(() => {
    const currentUser = CAST.find((member) => member.name === activeName) ?? CAST[1]
    return {
      currentUser,
      isAuthenticated: signedIn,
      signInAs: (name: string) => {
        setActiveName(name)
        setSignedIn(true)
      },
      signOut: () => setSignedIn(false),
    }
  }, [activeName, signedIn])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
