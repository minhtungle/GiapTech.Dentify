import { api } from "./api"
import type { ClinicSettingsDto, UpdateClinicSettingsDto } from "@/types/clinicSettings"

const BASE = "/api/app/clinic-settings"

export const clinicSettingsApi = {
  get: () => api.get<ClinicSettingsDto>(BASE),
  update: (input: UpdateClinicSettingsDto) => api.put<void>(BASE, input),
}
