const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  Doctor: "Bác sĩ",
  Receptionist: "Lễ tân",
  Accountant: "Kế toán",
  Patient: "Bệnh nhân (cổng tự phục vụ)",
}

export function roleDisplayName(roleName: string): string {
  return ROLE_LABELS[roleName] ?? roleName
}
