export interface BalanceResponse {
  from: string
  to: string
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

export interface TypeTotal {
  type: 'TITHE' | 'OFFERING' | 'SPECIAL_OFFERING' | 'OTHER'
  total: number
}

export interface DonationSummaryResponse {
  from: string
  to: string
  totalsByType: TypeTotal[]
  grandTotal: number
}

export interface CategoryTotal {
  category:
    | 'RENT'
    | 'UTILITIES'
    | 'SALARIES'
    | 'SUPPLIES'
    | 'MISSIONS'
    | 'MAINTENANCE'
    | 'OTHER'
  total: number
}

export interface ExpenseSummaryResponse {
  from: string
  to: string
  totalsByCategory: CategoryTotal[]
  grandTotal: number
}

export interface UserResponse {
  id: number
  username: string
  fullName: string
  email: string
  active: boolean
  roles: string[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type DonationType = 'TITHE' | 'OFFERING' | 'SPECIAL_OFFERING' | 'OTHER'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER'

export interface DonationResponse {
  id: number
  amount: number
  donationDate: string
  donationType: DonationType
  paymentMethod: PaymentMethod
  donorId: number | null
  donorName: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateDonationRequest {
  amount: number
  donationDate: string
  donationType: DonationType
  paymentMethod: PaymentMethod
  donorId?: number | null
  notes?: string | null
  confirmDuplicate?: boolean
}

export interface UpdateDonationRequest {
  amount?: number
  donationDate?: string
  donationType?: DonationType
  paymentMethod?: PaymentMethod
  donorId?: number | null
  notes?: string | null
}

export interface DonationCreateResponse {
  donation: DonationResponse
  duplicateWarning: boolean
  saved: boolean
}

export interface DonorResponse {
  id: number
  fullName: string
  dniNie: string
  email: string | null
  phone: string | null
  address: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDonorRequest {
  fullName: string
  dniNie: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface UpdateDonorRequest {
  fullName?: string
  dniNie?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  active?: boolean
}
