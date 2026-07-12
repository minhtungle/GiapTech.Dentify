import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Pencil, Plus, ShieldPlus, Trash2 } from "lucide-react"
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
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { insurancePoliciesApi } from "@/lib/insurance-policies-api"
import { ApiError } from "@/lib/api"
import type { CreateUpdateInsurancePolicyDto, InsurancePolicyDto } from "@/types/insurancePolicy"

interface InsurancePoliciesPanelProps {
  patientId: string
}

function emptyForm(patientId: string): CreateUpdateInsurancePolicyDto {
  return {
    patientId,
    providerName: "",
    policyNumber: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    expiryDate: null,
    notes: "",
  }
}

function isExpired(policy: InsurancePolicyDto): boolean {
  return policy.expiryDate != null && new Date(policy.expiryDate) < new Date()
}

export function InsurancePoliciesPanel({ patientId }: InsurancePoliciesPanelProps) {
  const [policies, setPolicies] = useState<InsurancePolicyDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateInsurancePolicyDto>(emptyForm(patientId))
  const [isSaving, setIsSaving] = useState(false)

  const [deletingPolicy, setDeletingPolicy] = useState<InsurancePolicyDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await insurancePoliciesApi.getList(patientId)
      setPolicies(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách bảo hiểm")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(patientId))
    setDialogOpen(true)
  }

  const openEditDialog = (policy: InsurancePolicyDto) => {
    setEditingId(policy.id)
    setForm({
      patientId,
      providerName: policy.providerName,
      policyNumber: policy.policyNumber,
      effectiveDate: policy.effectiveDate.slice(0, 10),
      expiryDate: policy.expiryDate ? policy.expiryDate.slice(0, 10) : null,
      notes: policy.notes ?? "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto: CreateUpdateInsurancePolicyDto = {
        ...form,
        effectiveDate: new Date(form.effectiveDate).toISOString(),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      }
      if (editingId) {
        await insurancePoliciesApi.update(editingId, dto)
        toast.success("Đã cập nhật bảo hiểm")
      } else {
        await insurancePoliciesApi.create(dto)
        toast.success("Đã thêm bảo hiểm mới")
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
    if (!deletingPolicy) return
    setIsDeleting(true)
    try {
      await insurancePoliciesApi.delete(deletingPolicy.id)
      toast.success("Đã xoá bảo hiểm")
      setDeletingPolicy(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Thêm bảo hiểm
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Số hợp đồng</TableHead>
              <TableHead>Hiệu lực từ</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && policies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldPlus className="size-8" />
                    <p>Chưa có bảo hiểm nào.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.providerName}</TableCell>
                  <TableCell>{policy.policyNumber}</TableCell>
                  <TableCell>{new Date(policy.effectiveDate).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell>
                    {policy.expiryDate ? (
                      <div className="flex items-center gap-2">
                        {new Date(policy.expiryDate).toLocaleDateString("vi-VN")}
                        {isExpired(policy) && <Badge variant="destructive">Hết hạn</Badge>}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{policy.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sửa"
                      aria-label={`Sửa bảo hiểm ${policy.providerName}`}
                      onClick={() => openEditDialog(policy)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Xoá"
                      aria-label={`Xoá bảo hiểm ${policy.providerName}`}
                      onClick={() => setDeletingPolicy(policy)}
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
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa bảo hiểm" : "Thêm bảo hiểm"}</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="providerName">Nhà cung cấp</Label>
                <Input
                  id="providerName"
                  required
                  value={form.providerName}
                  onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="policyNumber">Số hợp đồng</Label>
                <Input
                  id="policyNumber"
                  required
                  value={form.policyNumber}
                  onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="effectiveDate">Hiệu lực từ</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    required
                    value={form.effectiveDate}
                    onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Hết hạn</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={form.expiryDate ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value === "" ? null : e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingPolicy !== null}
        onOpenChange={(open) => !open && setDeletingPolicy(null)}
        title="Xoá bảo hiểm"
        description={`Bạn có chắc muốn xoá bảo hiểm "${deletingPolicy?.providerName}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
