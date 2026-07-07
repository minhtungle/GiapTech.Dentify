import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Download, Pencil, Plus, Receipt, Trash2, Upload } from "lucide-react"
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
import { expensesApi } from "@/lib/expenses-api"
import { ApiError } from "@/lib/api"
import { downloadCsv, parseCsvToObjects, toCsv } from "@/lib/csv"
import { formatCurrency } from "@/lib/utils"
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

  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [deletingExpense, setDeletingExpense] = useState<ExpenseDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategoryName | "">("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await expensesApi.getList({
        maxResultCount: 100,
        sorting: "expenseDate desc",
        category: categoryFilter || undefined,
        fromDate: fromDateFilter ? new Date(fromDateFilter).toISOString() : undefined,
        toDate: toDateFilter ? new Date(toDateFilter).toISOString() : undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDelete = async () => {
    if (!deletingExpense) return
    setIsDeleting(true)
    try {
      await expensesApi.delete(deletingExpense.id)
      toast.success("Đã xoá chi phí")
      setDeletingExpense(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const result = await expensesApi.getList({ maxResultCount: 1000, sorting: "expenseDate desc" })
      const csv = toCsv(
        ["Ngày", "Danh mục", "Số tiền", "Ghi chú"],
        result.items.map((e) => [
          e.expenseDate.slice(0, 10),
          EXPENSE_CATEGORY_LABELS_VI[e.category],
          e.amount,
          e.description ?? "",
        ]),
      )
      downloadCsv(`chi-phi-${new Date().toISOString().slice(0, 10)}.csv`, csv)
      toast.success(`Đã xuất ${result.items.length} khoản chi ra CSV`)
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
      const expenseDate = row["Ngày"]?.trim()
      const amountText = row["Số tiền"]?.trim()
      const amount = Number(amountText)

      if (!expenseDate || !amountText || Number.isNaN(amount) || amount <= 0) {
        errors.push(`Dòng ${i + 2}: thiếu Ngày hoặc Số tiền không hợp lệ`)
        continue
      }

      const categoryLabel = row["Danh mục"]?.trim()
      const category = (Object.keys(EXPENSE_CATEGORY_LABELS_VI) as unknown as (keyof typeof EXPENSE_CATEGORY_LABELS_VI)[]).find(
        (key) => EXPENSE_CATEGORY_LABELS_VI[key] === categoryLabel,
      )
      const categoryName = (Object.keys(ExpenseCategory) as ExpenseCategoryName[]).find(
        (key) => ExpenseCategory[key] === (category ?? ExpenseCategory.Other),
      ) ?? "Other"

      try {
        await expensesApi.create({
          expenseDate: new Date(expenseDate).toISOString(),
          amount,
          category: categoryName,
          description: row["Ghi chú"]?.trim() || undefined,
        })
        successCount++
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Lỗi không xác định"
        errors.push(`Dòng ${i + 2}: ${message}`)
      }
    }

    setIsImporting(false)

    if (successCount > 0) {
      toast.success(`Đã nhập ${successCount}/${rows.length} khoản chi`)
      await loadData()
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} dòng lỗi: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chi phí</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} khoản chi — Tổng: {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            aria-label="Chọn file CSV để nhập"
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
            Thêm chi phí
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Select
          value={categoryFilter || "all"}
          onValueChange={(value: string) =>
            setCategoryFilter(value === "all" ? "" : (value as ExpenseCategoryName))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi danh mục</SelectItem>
            {EXPENSE_CATEGORY_NAMES.map((category) => (
              <SelectItem key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS_VI[ExpenseCategory[category]]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="Từ ngày"
          value={fromDateFilter}
          onChange={(e) => setFromDateFilter(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          aria-label="Đến ngày"
          value={toDateFilter}
          onChange={(e) => setToDateFilter(e.target.value)}
          className="w-40"
        />
        <Button variant="outline" onClick={() => void loadData()}>
          Lọc
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
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Receipt className="size-8" />
                    <p>Chưa có khoản chi nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm khoản chi đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.expenseDate).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>
                  <Badge variant="outline">{EXPENSE_CATEGORY_LABELS_VI[expense.category]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{expense.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Sửa"
                    aria-label={`Sửa khoản chi ${expense.description || EXPENSE_CATEGORY_LABELS_VI[expense.category]}`}
                    onClick={() => openEditDialog(expense)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xoá"
                    aria-label={`Xoá khoản chi ${expense.description || EXPENSE_CATEGORY_LABELS_VI[expense.category]}`}
                    onClick={() => setDeletingExpense(expense)}
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
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  value={form.category}
                  onValueChange={(value: ExpenseCategoryName) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger id="category">
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

      <ConfirmDialog
        open={deletingExpense !== null}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        title="Xoá khoản chi"
        description={`Bạn có chắc muốn xoá khoản chi "${deletingExpense?.description || (deletingExpense && EXPENSE_CATEGORY_LABELS_VI[deletingExpense.category])}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
