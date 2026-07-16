import { userManager } from "@/auth/userManager"

const API_URL = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const user = await userManager.getUser()

  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  headers.set("Accept-Language", "vi")
  if (user?.access_token) {
    headers.set("Authorization", `Bearer ${user.access_token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let details: unknown
    try {
      details = await response.json()
    } catch {
      // no JSON body
    }
    const message =
      (details as { error?: { message?: string } })?.error?.message ??
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function toQueryString(params: object): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value))
    }
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ""
}

export const api = {
  get: <T>(path: string, params?: object) =>
    request<T>(`${path}${params ? toQueryString(params) : ""}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, params?: object) =>
    request<T>(`${path}${params ? toQueryString(params) : ""}`, {
      method: "DELETE",
    }),
}
