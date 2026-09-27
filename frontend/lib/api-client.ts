import type { RideRequestResponse, Zone } from "@/types/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"

interface CreateRideInput {
  pickup_zone: Zone
  dropoff_zone: Zone
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  seats_requested: number
}

// thin fetch wrapper matching docs/api-contracts.md exactly — snake_case
// request bodies, /api/v1 prefix. Not wired into any page yet; screens
// currently render from lib/mock-data.ts until the auth/rides integration
// branch lands.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(body.message ?? `Request to ${path} failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const apiClient = {
  createRide: (input: CreateRideInput) =>
    request<RideRequestResponse>("/rides", { method: "POST", body: JSON.stringify(input) }),
  getRide: (id: string) => request<RideRequestResponse>(`/rides/${id}`),
  getMyRides: () => request<RideRequestResponse[]>("/rides/me"),
  cancelRide: (id: string) => request<RideRequestResponse>(`/rides/${id}/cancel`, { method: "PATCH" }),
}
