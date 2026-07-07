import { useEffect, useState } from "react"
import type { DragEvent, FormEvent } from "react"
import { FlaskConical, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { labWorksApi } from "@/lib/lab-works-api"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
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

  const [deletingLabWork, setDeletingLabWork] = useState<LabWorkDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")

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

  const handleDelete = async () => {
    if (!deletingLabWork) return
    setIsDeleting(true)
    try {
      await labWorksApi.delete(deletingLabWork.id)
      toast.success("Đã xoá ca labo")
      setDeletingLabWork(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  const changeStatus = async (id: string, status: LabWorkStatusName) => {
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

  const handleDrop = async (e: DragEvent, status: LabWorkStatusName) => {
    e.preventDefault()
    const id = draggingId
    setDraggingId(null)
    if (!id) return
    await changeStatus(id, status)
  }

  const visibleLabWorks = labWorks.filter((x) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    return (
      x.patientFullName.toLowerCase().includes(term) || x.labName.toLowerCase().includes(term)
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Labo</h1>
          <p className="text-sm text-muted-foreground">
            {labWorks.length} ca đang theo dõi — kéo thả thẻ hoặc dùng ô trạng thái để cập nhật
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={patients.length === 0}>
          <Plus />
          Thêm ca labo
        </Button>
      </div>

      <Input
        placeholder="Tìm theo tên bệnh nhân hoặc labo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {LAB_WORK_BOARD_COLUMNS.map((column) => {
            const cards = visibleLabWorks.filter((x) => x.status === LabWorkStatus[column])
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

                {cards.length === 0 && (
                  <div className="flex flex-col items-center gap-1 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                    <FlaskConical className="size-5" />
                    Chưa có ca nào
                  </div>
                )}

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
                    <CardContent className="flex flex-col gap-2 px-3 py-0 text-xs text-muted-foreground">
                      <span>{card.labName} — {card.workType}</span>
                      {card.toothNumberList.length > 0 && (
                        <span>Răng: {card.toothNumberList.join(", ")}</span>
                      )}
                      <span>{formatCurrency(card.cost)}</span>

                      <Select
                        value={LAB_WORK_BOARD_COLUMNS.find((c) => LabWorkStatus[c] === card.status)}
                        onValueChange={(value: LabWorkStatusName) => void changeStatus(card.id, value)}
                      >
                        <SelectTrigger aria-label={`Đổi trạng thái ca labo của ${card.patientFullName}`} className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LAB_WORK_BOARD_COLUMNS.map((column) => (
                            <SelectItem key={column} value={column}>
                              {LAB_WORK_STATUS_LABELS_VI[LabWorkStatus[column]]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="mt-1 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Sửa"
                          aria-label={`Sửa ca labo của ${card.patientFullName}`}
                          onClick={() => openEditDialog(card)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Xoá"
                          aria-label={`Xoá ca labo của ${card.patientFullName}`}
                          onClick={() => setDeletingLabWork(card)}
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
              <Label htmlFor="labWorkPatientId">Bệnh nhân</Label>
              <Select
                value={form.patientId}
                onValueChange={(value: string) => setForm({ ...form, patientId: value })}
              >
                <SelectTrigger id="labWorkPatientId">
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

      <ConfirmDialog
        open={deletingLabWork !== null}
        onOpenChange={(open) => !open && setDeletingLabWork(null)}
        title="Xoá ca labo"
        description={`Bạn có chắc muốn xoá ca labo "${deletingLabWork?.labName} — ${deletingLabWork?.workType}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
