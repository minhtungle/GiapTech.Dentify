import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Ban,
  CheckCircle2,
  ClipboardList,
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
import { servicesApi } from "@/lib/services-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { CreateUpdateServiceDto, ServiceDto } from "@/types/service"

function emptyForm(): CreateUpdateServiceDto {
  return { name: "", price: 0 }
}

export function ServicesPage() {
  const [services, setServices] = useState<ServiceDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateServiceDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [deletingService, setDeletingService] = useState<ServiceDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await servicesApi.getActiveList()
      setServices(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách dịch vụ")
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

  const openEditDialog = (service: ServiceDto) => {
    setEditingId(service.id)
    setForm({ name: service.name, price: service.price })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await servicesApi.update(editingId, form)
        toast.success("Đã cập nhật dịch vụ")
      } else {
        await servicesApi.create(form)
        toast.success("Đã thêm dịch vụ mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (service: ServiceDto) => {
    try {
      if (service.isActive) {
        await servicesApi.deactivate(service.id)
        toast.success("Đã ngừng cung cấp")
      } else {
        await servicesApi.activate(service.id)
        toast.success("Đã kích hoạt lại")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return
    setIsDeleting(true)
    try {
      await servicesApi.delete(deletingService.id)
      toast.success("Đã xoá dịch vụ")
      setDeletingService(null)
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
          <h1 className="text-2xl font-semibold">Dịch vụ</h1>
          <p className="text-sm text-muted-foreground">{services.length} dịch vụ</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm dịch vụ
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên dịch vụ</TableHead>
              <TableHead>Giá tham chiếu</TableHead>
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
            {!isLoading && services.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="size-8" />
                    <p>Chưa có dịch vụ nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm dịch vụ đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{formatCurrency(service.price)}</TableCell>
                  <TableCell>
                    <Badge variant={service.isActive ? "success" : "outline"}>
                      {service.isActive ? "Đang cung cấp" : "Ngừng cung cấp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Hành động cho ${service.name}`}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(service)}>
                          <Pencil className="size-4" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleToggleActive(service)}>
                          {service.isActive ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          {service.isActive ? "Ngừng cung cấp" : "Kích hoạt lại"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingService(service)}
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
              <DialogTitle>{editingId ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên dịch vụ</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Giá tham chiếu</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="1000"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
        open={deletingService !== null}
        onOpenChange={(open) => !open && setDeletingService(null)}
        title="Xoá dịch vụ"
        description={`Bạn có chắc muốn xoá dịch vụ "${deletingService?.name}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
