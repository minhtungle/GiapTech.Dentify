import { useEffect, useRef, useState } from "react"
import { Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { appointmentPhotoApi } from "@/lib/appointment-photo-api"
import { ApiError } from "@/lib/api"
import {
  ALLOWED_PHOTO_CONTENT_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from "@/types/appointmentPhoto"
import type { AppointmentPhotoDto } from "@/types/appointmentPhoto"

interface AppointmentPhotosDialogProps {
  appointmentId: string | null
  patientName?: string
  onOpenChange: (open: boolean) => void
}

interface PhotoWithUrl extends AppointmentPhotoDto {
  blobUrl: string
}

export function AppointmentPhotosDialog({
  appointmentId,
  patientName,
  onOpenChange,
}: AppointmentPhotosDialogProps) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const revokeAllBlobUrls = (list: PhotoWithUrl[]) => {
    list.forEach((p) => URL.revokeObjectURL(p.blobUrl))
  }

  const loadPhotos = async (id: string) => {
    setIsLoading(true)
    try {
      const list = await appointmentPhotoApi.getList(id)
      const withUrls = await Promise.all(
        list.map(async (photo) => ({
          ...photo,
          blobUrl: await appointmentPhotoApi.getDownloadBlobUrl(photo.id),
        })),
      )
      setPhotos((prev) => {
        revokeAllBlobUrls(prev)
        return withUrls
      })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách ảnh")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (appointmentId) {
      void loadPhotos(appointmentId)
    } else {
      setPhotos((prev) => {
        revokeAllBlobUrls(prev)
        return []
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !appointmentId) return

    if (!ALLOWED_PHOTO_CONTENT_TYPES.includes(file.type)) {
      toast.error("Chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WEBP")
      return
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error("Kích thước ảnh vượt quá 10MB")
      return
    }

    setIsUploading(true)
    try {
      await appointmentPhotoApi.upload(appointmentId, file)
      toast.success("Đã tải ảnh lên")
      await loadPhotos(appointmentId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tải ảnh lên thất bại")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (photo: PhotoWithUrl) => {
    if (!appointmentId || !confirm("Xoá ảnh này?")) return
    try {
      await appointmentPhotoApi.delete(photo.id)
      toast.success("Đã xoá ảnh")
      await loadPhotos(appointmentId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá ảnh thất bại")
    }
  }

  return (
    <Dialog open={appointmentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ảnh lịch hẹn{patientName ? ` — ${patientName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_PHOTO_CONTENT_TYPES.join(",")}
              className="hidden"
              onChange={(e) => void handleFileSelected(e)}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="size-4" />
              {isUploading ? "Đang tải lên..." : "Tải ảnh lên"}
            </Button>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

          {!isLoading && photos.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có ảnh nào.</p>
          )}

          {!isLoading && photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-lg border">
                  <img
                    src={photo.blobUrl}
                    alt={photo.fileName}
                    className="aspect-square w-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => void handleDelete(photo)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
