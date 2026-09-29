"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

const DEMO_ACCOUNTS = [
  {
    name: "Jashim",
    role: "Driver",
    phone: "01700000000",
    password: "password123",
  },
  {
    name: "Nusrat",
    role: "Passenger",
    phone: "01700000001",
    password: "password123",
  },
  {
    name: "Rafiq",
    role: "Passenger",
    phone: "01700000002",
    password: "password123",
  },
  {
    name: "Shirin",
    role: "Passenger",
    phone: "01700000003",
    password: "password123",
  },
] as const

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignIn(
    submittedPhone: string,
    submittedPassword: string,
  ) {
    setError(null)
    setIsSubmitting(true)

    try {
      const user = await signIn(
        submittedPhone,
        submittedPassword,
      )

      if (user.role === "DRIVER") {
        router.push("/dashboard")
      } else {
        router.push("/request")
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("Unable to sign in. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    await handleSignIn(phone, password)
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center">
          <span className="text-[14px] font-semibold tracking-[0.02em]">
            Dhaka Tesla Pool
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-6 py-10">
          <h1 className="text-[32px] font-medium leading-tight tracking-[-0.02em]">
            Share the ride.
            <br />
            Split the fare.
          </h1>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <label className="flex h-[52px] items-center rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-4">
              <span className="mr-2 text-[14px] text-[var(--muted)]">
                +880
              </span>

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="1700000001"
                inputMode="numeric"
                autoComplete="tel"
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </label>

            <input
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              className="h-[52px] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-4 text-[15px] outline-none"
            />

            {error && (
              <p
                role="alert"
                className="rounded-[8px] border border-red-500/20 bg-red-500/5 px-3 py-2 text-[13px] text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[52px] rounded-[8px] bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-ink)] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>

          <a
            href="/signup"
            className="text-center text-[13px] text-[var(--muted)] underline-offset-4 hover:underline"
          >
            New here? Create an account
          </a>

          <div className="rounded-[8px] border border-[var(--hairline)] p-2">
            <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.08em] text-[var(--faint)]">
              Demo accounts
            </p>

            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.name}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    void handleSignIn(
                      account.phone,
                      account.password,
                    )
                  }
                  className="rounded-full border border-[var(--hairline)] px-3 py-1.5 text-[12px] text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {account.name}{" "}
                  <span className="text-[var(--faint)]">
                    · {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
