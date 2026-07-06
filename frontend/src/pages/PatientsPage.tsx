import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Plus, Smile, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  tags: [],
}

function toDto(form: CreateUpdatePatientDto, tagsInput: string): CreateUpdatePatientDto {
  return {
    ...form,
    phoneNumber: form.phoneNumber?.trim() || undefined,
    email: form.email?.trim() || undefined,
    address: form.address?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
    tags: tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
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
  const [isSaving, setIsSaving] = useState(false)

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
      tags: patient.tags,
    })
    setTagsInput(patient.tags.join(", "))
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto = toDto(form, tagsInput)
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

  const handleDelete = async (patient: PatientDto) => {
    if (!confirm(`Xoá bệnh nhân "${patient.fullName}"?`)) return
    try {
      await patientsApi.delete(patient.id)
      toast.success("Đã xoá bệnh nhân")
      await loadPatients()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bệnh nhân</h1>
          <p className="text-sm text-muted-foreground">{totalCount} bệnh nhân</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm bệnh nhân
        </Button>
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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chưa có bệnh nhân nào.
                </TableCell>
              </TableRow>
            )}
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">
                  {patient.fullName}
                  {patient.isChildPatient && (
                    <Badge variant="secondary" className="ml-2">
                      Trẻ em
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
                    title="Sơ đồ răng"
                    onClick={() => navigate(`/patients/${patient.id}/tooth-chart`)}
                  >
                    <Smile className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(patient)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => void handleDelete(patient)}>
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
                <Label>Giới tính</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value: GenderName) => setForm({ ...form, gender: value })}
                >
                  <SelectTrigger>
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
              <Label htmlFor="tags">Tags (phân tách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="vip, dị ứng thuốc"
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
    </div>
  )
}
