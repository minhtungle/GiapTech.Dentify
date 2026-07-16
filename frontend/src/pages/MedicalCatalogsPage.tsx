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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { medicalTermsApi } from "@/lib/medical-terms-api"
import { ApiError } from "@/lib/api"
import type { CreateUpdateMedicalTermDto, MedicalTermCategoryName, MedicalTermDto } from "@/types/medicalTerm"

function emptyForm(category: MedicalTermCategoryName): CreateUpdateMedicalTermDto {
  return { name: "", category }
}

interface MedicalTermTableProps {
  category: MedicalTermCategoryName
  categoryLabel: string
  itemNounSingular: string
}

function MedicalTermTable({ category, categoryLabel, itemNounSingular }: MedicalTermTableProps) {
  const [terms, setTerms] = useState<MedicalTermDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateMedicalTermDto>(emptyForm(category))
  const [isSaving, setIsSaving] = useState(false)

  const [deletingTerm, setDeletingTerm] = useState<MedicalTermDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await medicalTermsApi.getActiveList(category)
      setTerms(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : `Không tải được ${categoryLabel.toLowerCase()}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(category))
    setDialogOpen(true)
  }

  const openEditDialog = (term: MedicalTermDto) => {
    setEditingId(term.id)
    setForm({ name: term.name, category })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await medicalTermsApi.update(editingId, form)
        toast.success(`Đã cập nhật ${itemNounSingular}`)
      } else {
        await medicalTermsApi.create(form)
        toast.success(`Đã thêm ${itemNounSingular} mới`)
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (term: MedicalTermDto) => {
    try {
      if (term.isActive) {
        await medicalTermsApi.deactivate(term.id)
        toast.success("Đã ngừng sử dụng")
      } else {
        await medicalTermsApi.activate(term.id)
        toast.success("Đã kích hoạt lại")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingTerm) return
    setIsDeleting(true)
    try {
      await medicalTermsApi.delete(deletingTerm.id)
      toast.success(`Đã xoá khỏi danh mục ${categoryLabel.toLowerCase()}`)
      setDeletingTerm(null)
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
        <p className="text-sm text-muted-foreground">{terms.length} mục</p>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm {itemNounSingular}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
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
            {!isLoading && terms.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="size-8" />
                    <p>Chưa có mục nào trong danh mục {categoryLabel.toLowerCase()}.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm mục đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.name}</TableCell>
                  <TableCell>
                    <Badge variant={term.isActive ? "success" : "outline"}>
                      {term.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Hành động cho ${term.name}`}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(term)}>
                          <Pencil className="size-4" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleToggleActive(term)}>
                          {term.isActive ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          {term.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingTerm(term)}
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
              <DialogTitle>
                {editingId ? `Sửa ${itemNounSingular}` : `Thêm ${itemNounSingular}`}
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`name-${category}`}>Tên</Label>
                <Input
                  id={`name-${category}`}
                  required
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
        open={deletingTerm !== null}
        onOpenChange={(open) => !open && setDeletingTerm(null)}
        title={`Xoá khỏi danh mục ${categoryLabel.toLowerCase()}`}
        description={`Bạn có chắc muốn xoá "${deletingTerm?.name}"? Việc này không ảnh hưởng hồ sơ bệnh nhân đã lưu trước đó, chỉ gỡ khỏi danh mục chọn nhanh khi nhập liệu.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

export function MedicalCatalogsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Danh mục y khoa</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách Dị ứng, Bệnh nền, Tags dùng để chọn nhanh khi nhập hồ sơ bệnh nhân.
        </p>
      </div>

      <Tabs defaultValue="allergy">
        <TabsList>
          <TabsTrigger value="allergy">Dị ứng</TabsTrigger>
          <TabsTrigger value="medicalCondition">Bệnh nền</TabsTrigger>
          <TabsTrigger value="tag">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="allergy">
          <MedicalTermTable category="Allergy" categoryLabel="Dị ứng" itemNounSingular="dị ứng" />
        </TabsContent>
        <TabsContent value="medicalCondition">
          <MedicalTermTable
            category="MedicalCondition"
            categoryLabel="Bệnh nền"
            itemNounSingular="bệnh nền"
          />
        </TabsContent>
        <TabsContent value="tag">
          <MedicalTermTable category="Tag" categoryLabel="Tags" itemNounSingular="tag" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
