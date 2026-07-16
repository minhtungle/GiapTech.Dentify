import { userManager } from "@/auth/userManager"
import { ApiError } from "@/lib/api"
import type { AppointmentPhotoDto } from "@/types/appointmentPhoto"

const API_URL = import.meta.env.VITE_API_URL as string
const BASE = "/api/app/appointment-photo"

async function authHeaders(): Promise<HeadersInit> {
  const user = await userManager.getUser()
  return user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}
}

async function throwIfError(response: Response): Promise<void> {
  if (response.ok) return
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

export const appointmentPhotoApi = {
  getList: async (appointmentId: string): Promise<AppointmentPhotoDto[]> => {
    const response = await fetch(`${API_URL}${BASE}?appointmentId=${appointmentId}`, {
      headers: await authHeaders(),
    })
    await throwIfError(response)
    return (await response.json()) as AppointmentPhotoDto[]
  },

  upload: async (appointmentId: string, file: File, caption?: string): Promise<AppointmentPhotoDto> => {
    const formData = new FormData()
    formData.append("file", file)
    if (caption) {
      formData.append("caption", caption)
    }

    const response = await fetch(`${API_URL}${BASE}/upload/${appointmentId}`, {
      method: "POST",
      headers: await authHeaders(),
      body: formData,
    })
    await throwIfError(response)
    return (await response.json()) as AppointmentPhotoDto
  },

  updateCaption: async (id: string, caption: string | null): Promise<AppointmentPhotoDto> => {
    const response = await fetch(`${API_URL}${BASE}/${id}/caption`, {
      method: "PUT",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    })
    await throwIfError(response)
    return (await response.json()) as AppointmentPhotoDto
  },

  getDownloadBlobUrl: async (id: string): Promise<string> => {
    const response = await fetch(`${API_URL}${BASE}/${id}/download`, {
      method: "POST",
      headers: await authHeaders(),
    })
    await throwIfError(response)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}${BASE}/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    })
    await throwIfError(response)
  },
}
