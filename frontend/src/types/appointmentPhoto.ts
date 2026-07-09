export interface AppointmentPhotoDto {
  id: string
  appointmentId: string
  fileName: string
  contentType: string
  sizeBytes: number
  caption?: string | null
  creationTime: string
}

export interface UpdateAppointmentPhotoCaptionInput {
  caption?: string | null
}

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024
export const ALLOWED_PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
