import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Eye, Pencil, Plus, Trash2, Upload, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import { downloadCsv, parseCsvToObjects, toCsv } from "@/lib/csv"
import type { CreateUpdatePatientDto, GenderName, PatientDto } from "@/types/patient"
import { Gender, GENDER_LABELS_VI } from "@/types/patient"

const EMPTY_FORM: CreateUpdatePatientDto = {
  fullName: "",
  dateOfBirth: "",
  gender: "Male",
  phoneNumber: "",
  email: "",
  address: "",
  notes: "",
  referralSource: "",
  tags: [],
  allergies: [],
  medicalConditions: [],
}

function splitCommaList(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function toDto(
  form: CreateUpdatePatientDto,
  tagsInput: string,
  allergiesInput: string,
  medicalConditionsInput: string,
): CreateUpdatePatientDto {
  return {
    ...form,
    phoneNumber: form.phoneNumber?.trim() || undefined,
    email: form.email?.trim() || undefined,
    address: form.address?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
    referralSource: form.referralSource?.trim() || undefined,
    tags: splitCommaList(tagsInput),
    allergies: splitCommaList(allergiesInput),
    medicalConditions: splitCommaList(medicalConditionsInput),
  }
}

export function PatientsPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdatePatientDto>(EMPTY_FORM)
  const [tagsInput, setTagsInput] = useState("")
  const [allergiesInput, setAllergiesInput] = useState("")
  const [medicalConditionsInput, setMedicalConditionsInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [deletingPatient, setDeletingPatient] = useState<PatientDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPatients = async () => {
    setIsLoading(true)
    try {
      const result = await patientsApi.getList({
        filter: filter || undefined,
        maxResultCount: 100,
      })
      setPatients(result.items)
      setTotalCount(result.totalCount)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách bệnh nhân")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setTagsInput("")
    setAllergiesInput("")
    setMedicalConditionsInput("")
    setDialogOpen(true)
  }

  const openEditDialog = (patient: PatientDto) => {
    setEditingId(patient.id)
    setForm({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth.slice(0, 10),
      gender: (Object.keys(Gender) as GenderName[]).find(
        (key) => Gender[key] === patient.gender,
      ) ?? "Male",
      phoneNumber: patient.phoneNumber ?? "",
      email: patient.email ?? "",
      address: patient.address ?? "",
      notes: patient.notes ?? "",
      referralSource: patient.referralSource ?? "",
      tags: patient.tags,
      allergies: patient.allergies,
      medicalConditions: patient.medicalConditions,
    })
    setTagsInput(patient.tags.join(", "))
    setAllergiesInput(patient.allergies.join(", "))
    setMedicalConditionsInput(patient.medicalConditions.join(", "))
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto = toDto(form, tagsInput, allergiesInput, medicalConditionsInput)
      if (editingId) {
        await patientsApi.update(editingId, dto)
        toast.success("Đã cập nhật bệnh nhân")
      } else {
        await patientsApi.create(dto)
        toast.success("Đã thêm bệnh nhân mới")
      }
      setDialogOpen(false)
      await loadPatients()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPatient) return
    setIsDeleting(true)
    try {
      await patientsApi.delete(deletingPatient.id)
      toast.success("Đã xoá bệnh nhân")
      setDeletingPatient(null)
      await loadPatients()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const result = await patientsApi.getList({ maxResultCount: 1000 })
      const csv = toCsv(
        ["Họ và tên", "Ngày sinh", "Giới tính", "Số điện thoại", "Email", "Địa chỉ", "Nguồn giới thiệu", "Tags", "Ghi chú"],
        result.items.map((p) => [
          p.fullName,
          p.dateOfBirth.slice(0, 10),
          GENDER_LABELS_VI[p.gender],
          p.phoneNumber ?? "",
          p.email ?? "",
          p.address ?? "",
          p.referralSource ?? "",
          p.tags.join("; "),
          p.notes ?? "",
        ]),
      )
      downloadCsv(`benh-nhan-${new Date().toISOString().slice(0, 10)}.csv`, csv)
      toast.success(`Đã xuất ${result.items.length} bệnh nhân ra CSV`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xuất CSV thất bại")
    }
  }

  const handleImportCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const text = await file.text()
    const rows = parseCsvToObjects(text)
    if (rows.length === 0) {
      toast.error("File CSV không có dữ liệu")
      return
    }

    setIsImporting(true)
    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const fullName = row["Họ và tên"]?.trim()
      const dateOfBirth = row["Ngày sinh"]?.trim()

      if (!fullName || !dateOfBirth) {
        errors.push(`Dòng ${i + 2}: thiếu Họ và tên hoặc Ngày sinh`)
        continue
      }

      const genderLabel = row["Giới tính"]?.trim()
      const gender = (Object.keys(GENDER_LABELS_VI) as unknown as Gender[]).find(
        (key) => GENDER_LABELS_VI[key] === genderLabel,
      )
      const genderName = (Object.keys(Gender) as GenderName[]).find(
        (key) => Gender[key] === (gender ?? Gender.Male),
      ) ?? "Male"

      try {
        await patientsApi.create({
          fullName,
          dateOfBirth,
          gender: genderName,
          phoneNumber: row["Số điện thoại"]?.trim() || undefined,
          email: row["Email"]?.trim() || undefined,
          address: row["Địa chỉ"]?.trim() || undefined,
          referralSource: row["Nguồn giới thiệu"]?.trim() || undefined,
          notes: row["Ghi chú"]?.trim() || undefined,
          tags: (row["Tags"] ?? "")
            .split(";")
            .map((t) => t.trim())
            .filter(Boolean),
          allergies: [],
          medicalConditions: [],
        })
        successCount++
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Lỗi không xác định"
        errors.push(`Dòng ${i + 2} (${fullName}): ${message}`)
      }
    }

    setIsImporting(false)

    if (successCount > 0) {
      toast.success(`Đã nhập ${successCount}/${rows.length} bệnh nhân`)
      await loadPatients()
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} dòng lỗi: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bệnh nhân</h1>
          <p className="text-sm text-muted-foreground">{totalCount} bệnh nhân</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => void handleImportCsv(e)}
          />
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="size-4" />
            {isImporting ? "Đang nhập..." : "Nhập CSV"}
          </Button>
          <Button variant="outline" onClick={() => void handleExportCsv()} disabled={isImporting}>
            <Download className="size-4" />
            Xuất CSV
          </Button>
          <Button onClick={openCreateDialog} disabled={isImporting}>
            <Plus />
            Thêm bệnh nhân
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Tìm theo tên, số điện thoại hoặc tag..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void loadPatients()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => void loadPatients()}>
          Tìm
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Ngày sinh</TableHead>
              <TableHead>Giới tính</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserPlus className="size-8" />
                    <p>Chưa có bệnh nhân nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm bệnh nhân đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">
                  {patient.fullName}
                  {patient.isChildPatient && (
                    <Badge variant="secondary" className="ml-2">
                      Trẻ em
                    </Badge>
                  )}
                  {patient.allergies.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      Dị ứng
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell>{GENDER_LABELS_VI[patient.gender]}</TableCell>
                <TableCell>{patient.phoneNumber || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {patient.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xem chi tiết"
                    aria-label={`Xem chi tiết ${patient.fullName}`}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Sửa"
                    aria-label={`Sửa thông tin ${patient.fullName}`}
                    onClick={() => openEditDialog(patient)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xoá"
                    aria-label={`Xoá bệnh nhân ${patient.fullName}`}
                    onClick={() => setDeletingPatient(patient)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa bệnh nhân" : "Thêm bệnh nhân"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value: GenderName) => setForm({ ...form, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Nam</SelectItem>
                    <SelectItem value="Female">Nữ</SelectItem>
                    <SelectItem value="Other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber ?? ""}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
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
              <Label htmlFor="referralSource">Nguồn giới thiệu</Label>
              <Input
                id="referralSource"
                placeholder="Bạn bè giới thiệu, Facebook, Google..."
                value={form.referralSource ?? ""}
                onChange={(e) => setForm({ ...form, referralSource: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="allergies">Dị ứng (phân tách bằng dấu phẩy)</Label>
                <Input
                  id="allergies"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="Penicillin, Latex"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="medicalConditions">Bệnh nền (phân tách bằng dấu phẩy)</Label>
                <Input
                  id="medicalConditions"
                  value={medicalConditionsInput}
                  onChange={(e) => setMedicalConditionsInput(e.target.value)}
                  placeholder="Tăng huyết áp, Tiểu đường"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (phân tách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="vip"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingPatient !== null}
        onOpenChange={(open) => !open && setDeletingPatient(null)}
        title="Xoá bệnh nhân"
        description={`Bạn có chắc muốn xoá bệnh nhân "${deletingPatient?.fullName}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
