"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { apiClient, type UserResponse } from "@/lib/api-client"
import type { Role } from "@/types/api"

interface AuthContextValue {
  currentUser: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (
    phone: string,
    password: string,
  ) => Promise<UserResponse>
  signUp: (
    name: string,
    phone: string,
    password: string,
    role: Role,
  ) => Promise<UserResponse>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [currentUser, setCurrentUser] =
    useState<UserResponse | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const token = apiClient.getToken()

    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const user = await apiClient.getMe()
      setCurrentUser(user)
    } catch {
      apiClient.clearToken()
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const signIn = useCallback(
    async (
      phone: string,
      password: string,
    ): Promise<UserResponse> => {
      const response = await apiClient.signin({
        phone,
        password,
      })

      apiClient.storeToken(response.token)

      const user = await apiClient.getMe()
      setCurrentUser(user)

      return user
    },
    [],
  )

  const signUp = useCallback(
    async (
      name: string,
      phone: string,
      password: string,
      role: Role,
    ): Promise<UserResponse> => {
      const response = await apiClient.signup({
        name,
        phone,
        password,
        role,
      })

      apiClient.storeToken(response.token)

      const user = await apiClient.getMe()
      setCurrentUser(user)

      return user
    },
    [],
  )

  const signOut = useCallback(() => {
    apiClient.clearToken()
    setCurrentUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: currentUser !== null,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [
      currentUser,
      isLoading,
      signIn,
      signUp,
      signOut,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
