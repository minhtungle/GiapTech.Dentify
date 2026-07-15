export interface ApplicationConfigurationDto {
  auth: {
    grantedPolicies: Record<string, boolean>
  }
}
