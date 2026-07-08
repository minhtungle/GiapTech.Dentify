export interface ConsentFormDto {
  id: string
  appointmentId: string
  fileName: string
  contentType: string
  sizeBytes: number
  formTitle: string
  signedAt: string
  creationTime: string
}

export const MAX_CONSENT_FORM_SIZE_BYTES = 10 * 1024 * 1024
export const ALLOWED_CONSENT_FORM_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
]
