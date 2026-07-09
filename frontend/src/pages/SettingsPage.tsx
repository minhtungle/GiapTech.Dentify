import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Save, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { clinicSettingsApi } from "@/lib/clinic-settings-api"
import { ApiError } from "@/lib/api"
import type { ToothNotationSystemName } from "@/lib/toothNotation"
import type { UpdateClinicSettingsDto } from "@/types/clinicSettings"
import {
  ALLOWED_LOGO_CONTENT_TYPES,
  MAX_LOGO_SIZE_BYTES,
  TOOTH_NOTATION_SYSTEM_LABELS_VI,
  TOOTH_NOTATION_SYSTEM_NAMES,
} from "@/types/clinicSettings"

function emptyForm(): UpdateClinicSettingsDto {
  return { name: "", address: "", phoneNumber: "", logoUrl: "", toothNotationSystem: "Iso3950" }
}

export function SettingsPage() {
  const [form, setForm] = useState<UpdateClinicSettingsDto>(emptyForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUploadedLogo, setHasUploadedLogo] = useState(false)
  const [uploadedLogoBlobUrl, setUploadedLogoBlobUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const loadLogoPreview = async () => {
    try {
      const blobUrl = await clinicSettingsApi.getLogoDownloadBlobUrl()
      setUploadedLogoBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return blobUrl
      })
    } catch {
      // No logo uploaded yet, or download failed — fall back to URL preview.
    }
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await clinicSettingsApi.get()
        setForm({
          name: settings.name,
          address: settings.address ?? "",
          phoneNumber: settings.phoneNumber ?? "",
          logoUrl: settings.logoUrl ?? "",
          toothNotationSystem: settings.toothNotationSystem,
        })
        setHasUploadedLogo(settings.hasUploadedLogo)
        if (settings.hasUploadedLogo) {
          await loadLogoPreview()
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Không tải được cấu hình phòng khám")
      } finally {
        setIsLoading(false)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (uploadedLogoBlobUrl) URL.revokeObjectURL(uploadedLogoBlobUrl)
    }
  }, [uploadedLogoBlobUrl])

  const handleLogoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ALLOWED_LOGO_CONTENT_TYPES.includes(file.type)) {
      toast.error("Chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WEBP")
      return
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("Kích thước logo vượt quá 2MB")
      return
    }

    setIsUploadingLogo(true)
    try {
      await clinicSettingsApi.uploadLogo(file)
      toast.success("Đã tải logo lên")
      setHasUploadedLogo(true)
      await loadLogoPreview()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tải logo lên thất bại")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await clinicSettingsApi.update(form)
      toast.success("Đã lưu cấu hình phòng khám")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">Thông tin phòng khám</p>
      </div>

      {isLoading ? (
        <Card className="max-w-xl">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Thông tin phòng khám</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên phòng khám</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={form.address ?? ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber ?? ""}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Logo phòng khám</Label>
                <div className="flex items-center gap-3">
                  {uploadedLogoBlobUrl ? (
                    <img
                      src={uploadedLogoBlobUrl}
                      alt="Xem trước logo"
                      className="size-12 rounded border object-contain"
                    />
                  ) : (
                    form.logoUrl && (
                      <img
                        src={form.logoUrl}
                        alt="Xem trước logo"
                        className="size-12 rounded border object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = "block"
                        }}
                      />
                    )
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept={ALLOWED_LOGO_CONTENT_TYPES.join(",")}
                    aria-label="Chọn file logo để tải lên"
                    className="hidden"
                    onChange={(e) => void handleLogoFileSelected(e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="size-4" />
                    {isUploadingLogo ? "Đang tải lên..." : "Tải logo lên"}
                  </Button>
                </div>
                {hasUploadedLogo && (
                  <p className="text-xs text-muted-foreground">
                    Đã tải logo lên — logo này được ưu tiên hiển thị thay cho URL bên dưới.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Hoặc dùng URL logo ngoài</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://..."
                  value={form.logoUrl ?? ""}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="toothNotationSystem">Hệ ký hiệu số răng</Label>
                <Select
                  value={form.toothNotationSystem}
                  onValueChange={(value: ToothNotationSystemName) =>
                    setForm({ ...form, toothNotationSystem: value })
                  }
                >
                  <SelectTrigger id="toothNotationSystem">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOTH_NOTATION_SYSTEM_NAMES.map((system) => (
                      <SelectItem key={system} value={system}>
                        {TOOTH_NOTATION_SYSTEM_LABELS_VI[system]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button type="submit" disabled={isSaving}>
                  <Save className="size-4" />
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
