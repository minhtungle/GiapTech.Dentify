export interface ServiceDto {
  id: string
  name: string
  price: number
  isActive: boolean
}

export interface CreateUpdateServiceDto {
  name: string
  price: number
}
