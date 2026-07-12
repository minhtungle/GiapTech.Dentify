import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Armchair,
  Ban,
  CheckCircle2,
  MoreVertical,
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
import { chairsApi } from "@/lib/chairs-api"
import { ApiError } from "@/lib/api"
import type { ChairDto, CreateUpdateChairDto } from "@/types/chair"

function emptyForm(): CreateUpdateChairDto {
  return { name: "" }
}

export function ChairsPage() {
  const [chairs, setChairs] = useState<ChairDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateChairDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [deletingChair, setDeletingChair] = useState<ChairDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await chairsApi.getActiveList()
      setChairs(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách ghế")
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

  const openEditDialog = (chair: ChairDto) => {
    setEditingId(chair.id)
    setForm({ name: chair.name })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await chairsApi.update(editingId, form)
        toast.success("Đã cập nhật ghế")
      } else {
        await chairsApi.create(form)
        toast.success("Đã thêm ghế mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (chair: ChairDto) => {
    try {
      if (chair.isActive) {
        await chairsApi.deactivate(chair.id)
        toast.success("Đã ngừng sử dụng")
      } else {
        await chairsApi.activate(chair.id)
        toast.success("Đã kích hoạt lại")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingChair) return
    setIsDeleting(true)
    try {
      await chairsApi.delete(deletingChair.id)
      toast.success("Đã xoá ghế")
      setDeletingChair(null)
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
          <h1 className="text-2xl font-semibold">Ghế nha khoa</h1>
          <p className="text-sm text-muted-foreground">{chairs.length} ghế</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm ghế
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên ghế</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && chairs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Armchair className="size-8" />
                    <p>Chưa có ghế nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm ghế đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              chairs.map((chair) => (
                <TableRow key={chair.id}>
                  <TableCell className="font-medium">{chair.name}</TableCell>
                  <TableCell>
                    <Badge variant={chair.isActive ? "success" : "outline"}>
                      {chair.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Hành động cho ${chair.name}`}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(chair)}>
                          <Pencil className="size-4" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleToggleActive(chair)}>
                          {chair.isActive ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          {chair.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingChair(chair)}
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
              <DialogTitle>{editingId ? "Sửa ghế" : "Thêm ghế"}</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên ghế</Label>
              <Input
                id="name"
                required
                placeholder="Ví dụ: Ghế 1, Ghế VIP"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
        open={deletingChair !== null}
        onOpenChange={(open) => !open && setDeletingChair(null)}
        title="Xoá ghế"
        description={`Bạn có chắc muốn xoá ghế "${deletingChair?.name}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
