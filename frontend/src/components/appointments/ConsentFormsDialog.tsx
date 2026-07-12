import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Download, FileText, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { consentFormsApi } from "@/lib/consent-forms-api"
import { ApiError } from "@/lib/api"
import {
  ALLOWED_CONSENT_FORM_CONTENT_TYPES,
  MAX_CONSENT_FORM_SIZE_BYTES,
} from "@/types/consentForm"
import type { ConsentFormDto } from "@/types/consentForm"

interface ConsentFormsDialogProps {
  appointmentId: string | null
  patientName?: string
  onOpenChange: (open: boolean) => void
}

function emptyUploadForm() {
  return {
    formTitle: "",
    signedAt: new Date().toISOString().slice(0, 10),
  }
}

export function ConsentFormsDialog({
  appointmentId,
  patientName,
  onOpenChange,
}: ConsentFormsDialogProps) {
  const [forms, setForms] = useState<ConsentFormDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingForm, setDeletingForm] = useState<ConsentFormDto | null>(null)
  const [uploadForm, setUploadForm] = useState(emptyUploadForm())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadForms = async (id: string) => {
    setIsLoading(true)
    try {
      const list = await consentFormsApi.getList(id)
      setForms(list)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách phiếu đồng ý")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (appointmentId) {
      void loadForms(appointmentId)
      setUploadForm(emptyUploadForm())
    } else {
      setForms([])
    }
  }, [appointmentId])

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ALLOWED_CONSENT_FORM_CONTENT_TYPES.includes(file.type)) {
      toast.error("Chỉ chấp nhận file PDF, JPEG hoặc PNG")
      return
    }
    if (file.size > MAX_CONSENT_FORM_SIZE_BYTES) {
      toast.error("Kích thước file vượt quá 10MB")
      return
    }

    void handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    if (!appointmentId) return
    if (!uploadForm.formTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề phiếu trước khi tải lên")
      return
    }

    setIsUploading(true)
    try {
      await consentFormsApi.upload(
        appointmentId,
        uploadForm.formTitle,
        new Date(uploadForm.signedAt).toISOString(),
        file,
      )
      toast.success("Đã tải phiếu đồng ý lên")
      setUploadForm(emptyUploadForm())
      await loadForms(appointmentId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tải phiếu lên thất bại")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault()
    fileInputRef.current?.click()
  }

  const handleDownload = async (form: ConsentFormDto) => {
    try {
      const blobUrl = await consentFormsApi.getDownloadBlobUrl(form.id)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = form.fileName
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tải phiếu xuống thất bại")
    }
  }

  const handleDelete = async () => {
    if (!appointmentId || !deletingForm) return
    setIsDeleting(true)
    try {
      await consentFormsApi.delete(deletingForm.id)
      toast.success("Đã xoá phiếu đồng ý")
      setDeletingForm(null)
      await loadForms(appointmentId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá phiếu thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={appointmentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Phiếu đồng ý{patientName ? ` — ${patientName}` : ""}</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <form onSubmit={handleUploadSubmit} className="grid grid-cols-2 gap-2 rounded-md border p-3">
            <div className="col-span-2 grid gap-2 sm:col-span-1">
              <Label htmlFor="formTitle">Tiêu đề phiếu</Label>
              <Input
                id="formTitle"
                required
                placeholder="Ví dụ: Đồng ý nhổ răng"
                value={uploadForm.formTitle}
                onChange={(e) => setUploadForm({ ...uploadForm, formTitle: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid gap-2 sm:col-span-1">
              <Label htmlFor="signedAt">Ngày ký</Label>
              <Input
                id="signedAt"
                type="date"
                required
                value={uploadForm.signedAt}
                onChange={(e) => setUploadForm({ ...uploadForm, signedAt: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_CONSENT_FORM_CONTENT_TYPES.join(",")}
                aria-label="Chọn file phiếu đồng ý để tải lên"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button type="submit" variant="outline" disabled={isUploading}>
                <Upload className="size-4" />
                {isUploading ? "Đang tải lên..." : "Chọn file & tải lên"}
              </Button>
            </div>
          </form>

          {isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!isLoading && forms.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <FileText className="size-8" />
              <p>Chưa có phiếu đồng ý nào.</p>
            </div>
          )}

          {!isLoading && forms.length > 0 && (
            <div className="flex flex-col gap-2">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{form.formTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {form.fileName} · Ký ngày {new Date(form.signedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Tải xuống"
                      aria-label={`Tải xuống phiếu ${form.formTitle}`}
                      onClick={() => void handleDownload(form)}
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Xoá"
                      aria-label={`Xoá phiếu ${form.formTitle}`}
                      onClick={() => setDeletingForm(form)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter />
      </DialogContent>

      <ConfirmDialog
        open={deletingForm !== null}
        onOpenChange={(open) => !open && setDeletingForm(null)}
        title="Xoá phiếu đồng ý"
        description={`Bạn có chắc muốn xoá phiếu "${deletingForm?.formTitle}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </Dialog>
  )
}
