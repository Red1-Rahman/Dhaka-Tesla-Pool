"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function SignUpPage() {
  const { signInAs } = useAuth()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER")

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center">
          <span className="text-[14px] font-semibold tracking-[0.02em]">Dhaka Tesla Pool</span>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-6 py-10">
          <h1 className="text-[32px] font-medium leading-tight tracking-[-0.02em]">Create an account</h1>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              signInAs(name || "Nusrat")
            }}
            className="flex flex-col gap-3"
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="h-[52px] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-4 text-[15px] outline-none"
            />
            <label className="flex h-[52px] items-center rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-4">
              <span className="mr-2 text-[14px] text-[var(--muted)]">+880</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="1700000001"
                inputMode="numeric"
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Password"
              className="h-[52px] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-4 text-[15px] outline-none"
            />
            <div className="flex rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-2)] p-1" role="group" aria-label="Account type">
              {(["PASSENGER", "DRIVER"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  aria-pressed={role === option}
                  className={`h-9 flex-1 rounded-[6px] text-[13px] transition-colors ${role === option ? "bg-[var(--surface)] text-[var(--ink)]" : "text-[var(--muted)]"}`}
                >
                  {option === "PASSENGER" ? "Passenger" : "Driver"}
                </button>
              ))}
            </div>
            <button type="submit" className="h-[52px] rounded-[8px] bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-ink)] transition-transform active:scale-[0.99]">
              Continue
            </button>
          </form>

          <a href="/signin" className="text-center text-[13px] text-[var(--muted)] underline-offset-4 hover:underline">
            Already have an account? Sign in
          </a>
        </section>
      </div>
    </main>
  )
}
