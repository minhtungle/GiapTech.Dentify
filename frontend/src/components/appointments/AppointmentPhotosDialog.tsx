import { useEffect, useRef, useState } from "react"
import { ImageIcon, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ConfirmDialog"
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoWithUrl | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<PhotoWithUrl | null>(null)
  const [caption, setCaption] = useState("")
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
      await appointmentPhotoApi.upload(appointmentId, file, caption.trim() || undefined)
      toast.success("Đã tải ảnh lên")
      setCaption("")
      await loadPhotos(appointmentId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tải ảnh lên thất bại")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointmentId || !deletingPhoto) return
    setIsDeleting(true)
    try {
      await appointmentPhotoApi.delete(deletingPhoto.id)
      toast.success("Đã xoá ảnh")
      setDeletingPhoto(null)
      await loadPhotos(appointmentId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá ảnh thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={appointmentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ảnh lịch hẹn{patientName ? ` — ${patientName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="photoCaption">Chú thích (tuỳ chọn)</Label>
              <Input
                id="photoCaption"
                placeholder="Ví dụ: Trước khi trám"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_PHOTO_CONTENT_TYPES.join(",")}
                aria-label="Chọn ảnh để tải lên"
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
          </div>

          {isLoading && (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          )}

          {!isLoading && photos.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <ImageIcon className="size-8" />
              <p>Chưa có ảnh nào.</p>
            </div>
          )}

          {!isLoading && photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border">
                  <div className="relative">
                    <button
                      type="button"
                      className="block w-full"
                      aria-label={`Xem ảnh lớn: ${photo.fileName}`}
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      <img
                        src={photo.blobUrl}
                        alt={photo.fileName}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 size-7"
                      title="Xoá ảnh"
                      aria-label={`Xoá ảnh ${photo.fileName}`}
                      onClick={() => setDeletingPhoto(photo)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {photo.caption && (
                    <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      <Dialog open={previewPhoto !== null} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">{previewPhoto?.fileName}</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <img
              src={previewPhoto.blobUrl}
              alt={previewPhoto.fileName}
              className="max-h-[75vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingPhoto !== null}
        onOpenChange={(open) => !open && setDeletingPhoto(null)}
        title="Xoá ảnh"
        description="Bạn có chắc muốn xoá ảnh này? Hành động này không thể hoàn tác."
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </Dialog>
  )
}
