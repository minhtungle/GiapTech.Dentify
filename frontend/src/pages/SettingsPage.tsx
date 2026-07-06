import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { clinicSettingsApi } from "@/lib/clinic-settings-api"
import { ApiError } from "@/lib/api"
import type { UpdateClinicSettingsDto } from "@/types/clinicSettings"

function emptyForm(): UpdateClinicSettingsDto {
  return { name: "", address: "", phoneNumber: "", logoUrl: "" }
}

export function SettingsPage() {
  const [form, setForm] = useState<UpdateClinicSettingsDto>(emptyForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
        })
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Không tải được cấu hình phòng khám")
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

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
        <p className="text-sm text-muted-foreground">Đang tải...</p>
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
                <Label htmlFor="logoUrl">URL logo</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://..."
                  value={form.logoUrl ?? ""}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
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
