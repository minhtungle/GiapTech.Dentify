import { cn } from "@/lib/utils"
import type { ToothRecordDto } from "@/types/toothChart"
import { TOOTH_STATUS_COLORS, TOOTH_STATUS_LABELS_VI, ToothStatus } from "@/types/toothChart"

const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const PRIMARY_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const PRIMARY_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

const TOOTH_SIZE = 36
const TOOTH_GAP = 6
const MIDLINE_GAP = 16

function layoutRow(numbers: number[], halfCount: number) {
  return numbers.map((toothNumber, index) => {
    const extra = index >= halfCount ? MIDLINE_GAP : 0
    const x = index * (TOOTH_SIZE + TOOTH_GAP) + extra
    return { toothNumber, x }
  })
}

interface ToothChartSvgProps {
  isChildPatient: boolean
  records: ToothRecordDto[]
  selectedTooth?: number | null
  onToothClick: (toothNumber: number) => void
}

export function ToothChartSvg({
  isChildPatient,
  records,
  selectedTooth,
  onToothClick,
}: ToothChartSvgProps) {
  const upperNumbers = isChildPatient ? PRIMARY_UPPER : PERMANENT_UPPER
  const lowerNumbers = isChildPatient ? PRIMARY_LOWER : PERMANENT_LOWER
  const halfCount = upperNumbers.length / 2

  const upperRow = layoutRow(upperNumbers, halfCount)
  const lowerRow = layoutRow(lowerNumbers, halfCount)

  const width = upperRow[upperRow.length - 1].x + TOOTH_SIZE + 4
  const rowHeight = TOOTH_SIZE + 28
  const height = rowHeight * 2 + 20

  const recordByNumber = new Map(records.map((r) => [r.toothNumber, r]))

  const renderRow = (row: { toothNumber: number; x: number }[], y: number) =>
    row.map(({ toothNumber, x }) => {
      const record = recordByNumber.get(toothNumber)
      const status = record?.status ?? ToothStatus.Healthy
      const color = TOOTH_STATUS_COLORS[status]
      const isSelected = selectedTooth === toothNumber
      const label = `Răng số ${toothNumber} — ${TOOTH_STATUS_LABELS_VI[status]}`
      return (
        <g
          key={toothNumber}
          transform={`translate(${x}, ${y})`}
          onClick={() => onToothClick(toothNumber)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onToothClick(toothNumber)
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={label}
          aria-pressed={isSelected}
          className="cursor-pointer focus:outline-none focus-visible:[&>rect]:stroke-[3] focus-visible:[&>rect]:stroke-sky-500"
        >
          <rect
            width={TOOTH_SIZE}
            height={TOOTH_SIZE}
            rx={8}
            fill={color}
            stroke={isSelected ? "#0ea5e9" : "#374151"}
            strokeWidth={isSelected ? 3 : 1}
          />
          <text
            x={TOOTH_SIZE / 2}
            y={TOOTH_SIZE + 16}
            textAnchor="middle"
            className="select-none fill-foreground text-[11px] font-medium"
          >
            {toothNumber}
          </text>
        </g>
      )
    })

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-auto w-full max-w-3xl")}
      role="group"
      aria-label="Sơ đồ răng — chọn 1 răng để xem hoặc cập nhật tình trạng"
    >
      {renderRow(upperRow, 4)}
      <line
        x1={0}
        y1={rowHeight + 6}
        x2={width}
        y2={rowHeight + 6}
        stroke="#d1d5db"
        strokeDasharray="4 4"
      />
      {renderRow(lowerRow, rowHeight + 16)}
    </svg>
  )
}
