import type {
  RideRequestResponse,
  Role,
  Zone,
} from "@/types/api"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"

export interface AuthResponse {
  id: string
  name: string
  role: Role
  token: string
}

export interface UserResponse {
  id: string
  name: string
  phone: string
  role: Role
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly messages?: string[],
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function toErrorMessage(
  rawMessage: unknown,
  fallback: string,
): string {
  if (Array.isArray(rawMessage)) {
    const messages = rawMessage.filter(
      (message): message is string => typeof message === "string",
    )

    if (messages.length > 0) {
      return messages.join(", ")
    }
  }

  if (typeof rawMessage === "string") {
    return rawMessage
  }

  return fallback
}

function getResponseMessage(body: unknown): unknown {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body
  ) {
    return (body as { message?: unknown }).message
  }

  return undefined
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem("dhaka_tesla_pool_token")
}

function setStoredToken(token: string): void {
  localStorage.setItem("dhaka_tesla_pool_token", token)
}

function clearStoredToken(): void {
  localStorage.removeItem("dhaka_tesla_pool_token")
}

function normalizeBangladeshPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")

  if (digits.startsWith("880")) {
    return `0${digits.slice(3)}`
  }

  if (digits.startsWith("0")) {
    return digits
  }

  if (digits.length === 10 && digits.startsWith("1")) {
    return `0${digits}`
  }

  return phone
}

interface CreateRideInput {
  pickupZone: Zone
  dropoffZone: Zone
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  seatsRequested: number
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getStoredToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const fallback = `Request to ${path} failed with ${response.status}`

    const body = await response.json().catch(() => null)
    const rawMessage = getResponseMessage(body)

    const messages = Array.isArray(rawMessage)
      ? rawMessage.filter(
          (message): message is string =>
            typeof message === "string",
        )
      : undefined

    if (response.status === 401) {
      clearStoredToken()
    }

    throw new ApiError(
      toErrorMessage(
        rawMessage,
        response.statusText || fallback,
      ),
      response.status,
      messages,
    )
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  signup: (input: {
    name: string
    phone: string
    password: string
    role: Role
  }) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        phone: normalizeBangladeshPhone(input.phone),
      }),
    }),

  signin: (input: {
    phone: string
    password: string
  }) =>
    request<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({
        phone: normalizeBangladeshPhone(input.phone),
        password: input.password,
      }),
    }),

  getMe: () =>
    request<UserResponse>("/users/me"),

  createRide: (input: CreateRideInput) =>
    request<RideRequestResponse>("/rides", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getRide: (id: string) =>
    request<RideRequestResponse>(`/rides/${id}`),

  getMyRides: () =>
    request<RideRequestResponse[]>("/rides/me"),

  cancelRide: (id: string) =>
    request<RideRequestResponse>(`/rides/${id}/cancel`, {
      method: "PATCH",
    }),

  storeToken: setStoredToken,

  clearToken: clearStoredToken,

  getToken: getStoredToken,
}
