import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Ban,
  CheckCircle2,
  MoreVertical,
  PillBottle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { drugsApi } from "@/lib/drugs-api"
import { ApiError } from "@/lib/api"
import type { CreateUpdateDrugDto, DrugDto } from "@/types/drug"

function emptyForm(): CreateUpdateDrugDto {
  return { name: "", defaultDosage: "" }
}

export function DrugsPage() {
  const [drugs, setDrugs] = useState<DrugDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateDrugDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [deletingDrug, setDeletingDrug] = useState<DrugDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await drugsApi.getActiveList()
      setDrugs(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh mục thuốc")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEditDialog = (drug: DrugDto) => {
    setEditingId(drug.id)
    setForm({ name: drug.name, defaultDosage: drug.defaultDosage ?? "" })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await drugsApi.update(editingId, form)
        toast.success("Đã cập nhật thuốc")
      } else {
        await drugsApi.create(form)
        toast.success("Đã thêm thuốc mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (drug: DrugDto) => {
    try {
      if (drug.isActive) {
        await drugsApi.deactivate(drug.id)
        toast.success("Đã ngừng sử dụng")
      } else {
        await drugsApi.activate(drug.id)
        toast.success("Đã kích hoạt lại")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingDrug) return
    setIsDeleting(true)
    try {
      await drugsApi.delete(deletingDrug.id)
      toast.success("Đã xoá thuốc")
      setDeletingDrug(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Danh mục thuốc</h1>
          <p className="text-sm text-muted-foreground">{drugs.length} loại thuốc</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm thuốc
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên thuốc</TableHead>
              <TableHead>Liều lượng mặc định</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && drugs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <PillBottle className="size-8" />
                    <p>Chưa có thuốc nào trong danh mục.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm thuốc đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              drugs.map((drug) => (
                <TableRow key={drug.id}>
                  <TableCell className="font-medium">{drug.name}</TableCell>
                  <TableCell>{drug.defaultDosage || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={drug.isActive ? "success" : "outline"}>
                      {drug.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Hành động cho ${drug.name}`}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(drug)}>
                          <Pencil className="size-4" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleToggleActive(drug)}>
                          {drug.isActive ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          {drug.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingDrug(drug)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Xoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              <DialogTitle>{editingId ? "Sửa thuốc" : "Thêm thuốc"}</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên thuốc</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="defaultDosage">Liều lượng mặc định</Label>
              <Input
                id="defaultDosage"
                placeholder="Ví dụ: 500mg, ngày 2 lần"
                value={form.defaultDosage ?? ""}
                onChange={(e) => setForm({ ...form, defaultDosage: e.target.value })}
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
        open={deletingDrug !== null}
        onOpenChange={(open) => !open && setDeletingDrug(null)}
        title="Xoá thuốc"
        description={`Bạn có chắc muốn xoá thuốc "${deletingDrug?.name}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
