import { useMemo, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import viLocale from "@fullcalendar/core/locales/vi"
import type { EventDropArg, EventInput } from "@fullcalendar/core"
import type { AppointmentDto } from "@/types/appointment"
import { APPOINTMENT_STATUS_LABELS_VI, AppointmentStatus } from "@/types/appointment"
import type { ChairDto } from "@/types/chair"
import { formatCurrency } from "@/lib/utils"

const UNASSIGNED_CHAIR_ID = "unassigned"

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Scheduled]: "#0ea5e9",
  [AppointmentStatus.InProgress]: "#f59e0b",
  [AppointmentStatus.Completed]: "#22c55e",
  [AppointmentStatus.Cancelled]: "#94a3b8",
  [AppointmentStatus.NoShow]: "#ef4444",
}

interface AppointmentCalendarProps {
  appointments: AppointmentDto[]
  chairs: ChairDto[]
  onDateRangeChange: (fromDate: string, toDate: string) => void
  onEventClick: (appointmentId: string) => void
  onEventReschedule: (
    appointmentId: string,
    newDateTime: string,
    newChairId?: string | null,
  ) => Promise<void>
  onSelectSlot: (dateTime: string) => void
}

export function AppointmentCalendar({
  appointments,
  chairs,
  onDateRangeChange,
  onEventClick,
  onEventReschedule,
  onSelectSlot,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)

  const resources = useMemo(
    () => [
      ...chairs.map((chair) => ({ id: chair.id, title: chair.name })),
      { id: UNASSIGNED_CHAIR_ID, title: "Chưa xếp ghế" },
    ],
    [chairs],
  )

  const events: EventInput[] = useMemo(
    () =>
      appointments.map((a) => {
        const start = new Date(a.scheduledDateTime)
        const end = new Date(start.getTime() + a.durationMinutes * 60_000)
        return {
          id: a.id,
          title: a.patientFullName,
          start: start.toISOString(),
          end: end.toISOString(),
          resourceId: a.chairId ?? UNASSIGNED_CHAIR_ID,
          backgroundColor: STATUS_COLOR[a.status],
          borderColor: STATUS_COLOR[a.status],
          extendedProps: { appointment: a },
        }
      }),
    [appointments],
  )

  const handleEventDrop = async (arg: EventDropArg) => {
    const appointmentId = arg.event.id
    const newStart = arg.event.start
    if (!newStart) return
    const newResourceId = arg.newResource?.id
    const newChairId = newResourceId === undefined
      ? undefined
      : newResourceId === UNASSIGNED_CHAIR_ID
        ? null
        : newResourceId
    try {
      await onEventReschedule(appointmentId, newStart.toISOString(), newChairId)
    } catch {
      arg.revert()
    }
  }

  return (
    <div className="notion-calendar rounded-lg border bg-card p-3">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,resourceTimeGridDay",
        }}
        buttonText={{
          today: "Hôm nay",
          month: "Tháng",
          week: "Tuần",
          day: "Ngày",
          resourceTimeGridDay: "Theo ghế",
        }}
        locale={viLocale}
        height="auto"
        resources={resources}
        events={events}
        editable
        selectable
        eventClick={(arg) => onEventClick(arg.event.id)}
        eventDrop={(arg) => void handleEventDrop(arg)}
        select={(arg) => onSelectSlot(arg.start.toISOString())}
        datesSet={(arg) =>
          onDateRangeChange(arg.start.toISOString(), arg.end.toISOString())
        }
        eventContent={(arg) => {
          const appointment = arg.event.extendedProps.appointment as AppointmentDto
          const summary = `${arg.event.title} — ${APPOINTMENT_STATUS_LABELS_VI[appointment.status]} · ${formatCurrency(appointment.price)}`
          return (
            <div
              className="flex flex-col overflow-hidden px-1 py-0.5 text-xs leading-tight"
              title={summary}
              aria-label={summary}
            >
              <span className="truncate font-medium">{arg.event.title}</span>
              {arg.view.type !== "dayGridMonth" && (
                <span className="truncate opacity-90">
                  {APPOINTMENT_STATUS_LABELS_VI[appointment.status]} ·{" "}
                  {formatCurrency(appointment.price)}
                </span>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}
