import { api } from "./api"
import { userManager } from "@/auth/userManager"
import { ApiError } from "@/lib/api"
import type { ClinicSettingsDto, UpdateClinicSettingsDto } from "@/types/clinicSettings"

const API_URL = import.meta.env.VITE_API_URL as string
const BASE = "/api/app/clinic-settings"

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

export const clinicSettingsApi = {
  get: () => api.get<ClinicSettingsDto>(BASE),
  update: (input: UpdateClinicSettingsDto) => api.put<void>(BASE, input),

  uploadLogo: async (file: File): Promise<ClinicSettingsDto> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_URL}${BASE}/upload-logo`, {
      method: "POST",
      headers: await authHeaders(),
      body: formData,
    })
    await throwIfError(response)
    return (await response.json()) as ClinicSettingsDto
  },

  getLogoDownloadBlobUrl: async (): Promise<string> => {
    const response = await fetch(`${API_URL}${BASE}/download-logo`, {
      method: "POST",
      headers: await authHeaders(),
    })
    await throwIfError(response)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },
}
