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
