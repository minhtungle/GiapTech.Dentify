import type { PagedAndSortedRequest } from "./common"

export interface SupplyDto {
  id: string
  name: string
  unit: string
  quantity: number
  lowStockThreshold?: number | null
  isActive: boolean
  creationTime: string
  lastModificationTime?: string | null
}

export interface CreateUpdateSupplyDto {
  name: string
  unit: string
  lowStockThreshold?: number | null
}

export interface RestockSupplyDto {
  quantity: number
}

export interface SupplyUsageDto {
  id: string
  supplyId: string
  supplyName: string
  quantity: number
  appointmentId?: string | null
  usedAt: string
  notes?: string | null
  creationTime: string
}

export interface CreateSupplyUsageDto {
  supplyId: string
  quantity: number
  appointmentId?: string | null
  usedAt: string
  notes?: string | null
}

export interface GetSupplyUsageListRequest extends PagedAndSortedRequest {
  supplyId?: string
  appointmentId?: string
}
