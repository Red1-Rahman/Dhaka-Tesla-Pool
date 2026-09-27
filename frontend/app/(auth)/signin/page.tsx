"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { CAST } from "@/lib/mock-data"

export default function SignInPage() {
  const { signInAs } = useAuth()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center">
          <span className="text-[14px] font-semibold tracking-[0.02em]">Dhaka Tesla Pool</span>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-6 py-10">
          <h1 className="text-[32px] font-medium leading-tight tracking-[-0.02em]">
            Share the ride.
            <br />
            Split the fare.
          </h1>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              signInAs("Nusrat")
            }}
            className="flex flex-col gap-3"
          >
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
            <button type="submit" className="h-[52px] rounded-[8px] bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-ink)] transition-transform active:scale-[0.99]">
              Continue
            </button>
          </form>

          <a href="/signup" className="text-center text-[13px] text-[var(--muted)] underline-offset-4 hover:underline">
            New here? Create an account
          </a>

          <div className="rounded-[8px] border border-[var(--hairline)] p-2">
            <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.08em] text-[var(--faint)]">Demo accounts</p>
            <div className="flex flex-wrap gap-2">
              {CAST.map((member) => (
                <button
                  key={member.name}
                  onClick={() => signInAs(member.name)}
                  className="rounded-full border border-[var(--hairline)] px-3 py-1.5 text-[12px] text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)]"
                >
                  {member.name} <span className="text-[var(--faint)]">· {member.role === "DRIVER" ? "Driver" : "Passenger"}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
