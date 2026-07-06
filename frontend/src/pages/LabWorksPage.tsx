import { useEffect, useState } from "react"
import type { DragEvent, FormEvent } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { labWorksApi } from "@/lib/lab-works-api"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import type { CreateUpdateLabWorkDto, LabWorkDto, LabWorkStatusName } from "@/types/labWork"
import {
  LAB_WORK_BOARD_COLUMNS,
  LAB_WORK_STATUS_LABELS_VI,
  LabWorkStatus,
} from "@/types/labWork"
import type { PatientDto } from "@/types/patient"

function emptyForm(patientId = ""): CreateUpdateLabWorkDto {
  return {
    patientId,
    labName: "",
    workType: "",
    toothNumberList: [],
    sentDate: new Date().toISOString().slice(0, 10),
    cost: 0,
    status: "Sent",
    notes: "",
  }
}

export function LabWorksPage() {
  const [labWorks, setLabWorks] = useState<LabWorkDto[]>([])
  const [patients, setPatients] = useState<PatientDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateLabWorkDto>(emptyForm())
  const [toothNumbersInput, setToothNumbersInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [board, patientsResult] = await Promise.all([
        labWorksApi.getBoard(),
        patientsApi.getList({ maxResultCount: 1000 }),
      ])
      setLabWorks(board)
      setPatients(patientsResult.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách labo")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(patients[0]?.id ?? ""))
    setToothNumbersInput("")
    setDialogOpen(true)
  }

  const openEditDialog = (labWork: LabWorkDto) => {
    setEditingId(labWork.id)
    setForm({
      patientId: labWork.patientId,
      appointmentId: labWork.appointmentId,
      labName: labWork.labName,
      workType: labWork.workType,
      toothNumberList: labWork.toothNumberList,
      sentDate: labWork.sentDate.slice(0, 10),
      expectedReceiveDate: labWork.expectedReceiveDate?.slice(0, 10),
      cost: labWork.cost,
      status: (Object.keys(LabWorkStatus) as LabWorkStatusName[]).find(
        (key) => LabWorkStatus[key] === labWork.status,
      ) ?? "Sent",
      notes: labWork.notes ?? "",
    })
    setToothNumbersInput(labWork.toothNumberList.join(", "))
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const toothNumberList = toothNumbersInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !Number.isNaN(n))

      const dto: CreateUpdateLabWorkDto = {
        ...form,
        toothNumberList,
        sentDate: new Date(form.sentDate).toISOString(),
        expectedReceiveDate: form.expectedReceiveDate
          ? new Date(form.expectedReceiveDate).toISOString()
          : undefined,
      }

      if (editingId) {
        await labWorksApi.update(editingId, dto)
        toast.success("Đã cập nhật ca labo")
      } else {
        await labWorksApi.create(dto)
        toast.success("Đã thêm ca labo mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (labWork: LabWorkDto) => {
    if (!confirm(`Xoá ca labo "${labWork.labName} — ${labWork.workType}"?`)) return
    try {
      await labWorksApi.delete(labWork.id)
      toast.success("Đã xoá ca labo")
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    }
  }

  const handleDrop = async (e: DragEvent, status: LabWorkStatusName) => {
    e.preventDefault()
    const id = draggingId
    setDraggingId(null)
    if (!id) return

    const labWork = labWorks.find((x) => x.id === id)
    if (!labWork || LabWorkStatus[status] === labWork.status) return

    setLabWorks((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: LabWorkStatus[status] } : x)),
    )

    try {
      await labWorksApi.updateStatus(id, { status })
      toast.success("Đã cập nhật trạng thái")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
      await loadData()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Labo</h1>
          <p className="text-sm text-muted-foreground">
            {labWorks.length} ca đang theo dõi — kéo thả thẻ để đổi trạng thái
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={patients.length === 0}>
          <Plus />
          Thêm ca labo
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {LAB_WORK_BOARD_COLUMNS.map((column) => {
            const cards = labWorks.filter((x) => x.status === LabWorkStatus[column])
            return (
              <div
                key={column}
                className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => void handleDrop(e, column)}
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-medium">{LAB_WORK_STATUS_LABELS_VI[LabWorkStatus[column]]}</h2>
                  <Badge variant="outline">{cards.length}</Badge>
                </div>

                {cards.map((card) => (
                  <Card
                    key={card.id}
                    draggable
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="cursor-grab gap-2 py-3 active:cursor-grabbing"
                  >
                    <CardHeader className="gap-1 px-3 py-0">
                      <CardTitle className="text-sm">{card.patientFullName}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-1 px-3 py-0 text-xs text-muted-foreground">
                      <span>{card.labName} — {card.workType}</span>
                      {card.toothNumberList.length > 0 && (
                        <span>Răng: {card.toothNumberList.join(", ")}</span>
                      )}
                      <span>{card.cost.toLocaleString("vi-VN")}</span>
                      <div className="mt-1 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => openEditDialog(card)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => void handleDelete(card)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa ca labo" : "Thêm ca labo"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label>Bệnh nhân</Label>
              <Select
                value={form.patientId}
                onValueChange={(value: string) => setForm({ ...form, patientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bệnh nhân" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="labName">Tên labo</Label>
                <Input
                  id="labName"
                  required
                  value={form.labName}
                  onChange={(e) => setForm({ ...form, labName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workType">Loại công việc</Label>
                <Input
                  id="workType"
                  required
                  placeholder="Bọc sứ, Implant..."
                  value={form.workType}
                  onChange={(e) => setForm({ ...form, workType: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toothNumbers">Số răng liên quan (phân tách bằng dấu phẩy)</Label>
              <Input
                id="toothNumbers"
                placeholder="11, 12, 21"
                value={toothNumbersInput}
                onChange={(e) => setToothNumbersInput(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sentDate">Ngày gửi</Label>
                <Input
                  id="sentDate"
                  type="date"
                  required
                  value={form.sentDate}
                  onChange={(e) => setForm({ ...form, sentDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedReceiveDate">Ngày nhận dự kiến</Label>
                <Input
                  id="expectedReceiveDate"
                  type="date"
                  value={form.expectedReceiveDate ?? ""}
                  onChange={(e) => setForm({ ...form, expectedReceiveDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cost">Chi phí</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
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
