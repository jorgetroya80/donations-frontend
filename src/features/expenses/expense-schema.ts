import { z } from 'zod/v4'

export const expenseCategories = [
  'RENT',
  'UTILITIES',
  'SALARIES',
  'SUPPLIES',
  'MISSIONS',
  'MAINTENANCE',
  'OTHER',
] as const

export const paymentMethods = ['CASH', 'BANK_TRANSFER'] as const

export const createExpenseSchema = z.object({
  amount: z.number().min(0.01, 'El monto debe ser al menos 0.01'),
  expenseDate: z.string().min(1, 'La fecha es obligatoria'),
  category: z.enum(expenseCategories, {
    error: 'Seleccione una categoría',
  }),
  description: z.string().min(1, 'La descripción es obligatoria'),
  vendor: z.string().nullable().optional(),
  paymentMethod: z.enum(paymentMethods, {
    error: 'Seleccione un método de pago',
  }),
})

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>
