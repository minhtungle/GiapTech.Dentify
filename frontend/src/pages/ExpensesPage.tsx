import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
import { expensesApi } from "@/lib/expenses-api"
import { ApiError } from "@/lib/api"
import type { CreateUpdateExpenseDto, ExpenseCategoryName, ExpenseDto } from "@/types/expense"
import {
  EXPENSE_CATEGORY_LABELS_VI,
  EXPENSE_CATEGORY_NAMES,
  ExpenseCategory,
} from "@/types/expense"

function emptyForm(): CreateUpdateExpenseDto {
  return {
    expenseDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    category: "Other",
    description: "",
  }
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateExpenseDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await expensesApi.getList({
        maxResultCount: 100,
        sorting: "expenseDate desc",
      })
      setExpenses(result.items)
      setTotalCount(result.totalCount)
      setTotalAmount(result.items.reduce((sum, e) => sum + e.amount, 0))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách chi phí")
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

  const openEditDialog = (expense: ExpenseDto) => {
    setEditingId(expense.id)
    setForm({
      expenseDate: expense.expenseDate.slice(0, 10),
      amount: expense.amount,
      category: (Object.keys(ExpenseCategory) as ExpenseCategoryName[]).find(
        (key) => ExpenseCategory[key] === expense.category,
      ) ?? "Other",
      description: expense.description ?? "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto = {
        ...form,
        expenseDate: new Date(form.expenseDate).toISOString(),
      }
      if (editingId) {
        await expensesApi.update(editingId, dto)
        toast.success("Đã cập nhật chi phí")
      } else {
        await expensesApi.create(dto)
        toast.success("Đã thêm chi phí mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (expense: ExpenseDto) => {
    if (!confirm(`Xoá khoản chi "${expense.description || EXPENSE_CATEGORY_LABELS_VI[expense.category]}"?`)) return
    try {
      await expensesApi.delete(expense.id)
      toast.success("Đã xoá chi phí")
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chi phí</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} khoản chi — Tổng: {totalAmount.toLocaleString("vi-VN")}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm chi phí
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Chưa có khoản chi nào.
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.expenseDate).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>
                  <Badge variant="outline">{EXPENSE_CATEGORY_LABELS_VI[expense.category]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{expense.amount.toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-muted-foreground">{expense.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => void handleDelete(expense)}>
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
              <DialogTitle>{editingId ? "Sửa chi phí" : "Thêm chi phí"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expenseDate">Ngày chi</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  required
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Danh mục</Label>
                <Select
                  value={form.category}
                  onValueChange={(value: ExpenseCategoryName) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORY_NAMES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {EXPENSE_CATEGORY_LABELS_VI[ExpenseCategory[category]]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Số tiền</Label>
              <Input
                id="amount"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Ghi chú</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
