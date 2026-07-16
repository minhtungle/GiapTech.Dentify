import { api } from "./api"
import type { ApplicationConfigurationDto } from "@/types/applicationConfiguration"

export const applicationConfigurationApi = {
  get: () => api.get<ApplicationConfigurationDto>("/api/abp/application-configuration"),
}
