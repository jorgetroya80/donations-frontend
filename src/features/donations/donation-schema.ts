import { z } from 'zod/v4'

export const donationTypes = [
  'TITHE',
  'OFFERING',
  'SPECIAL_OFFERING',
  'OTHER',
] as const

export const paymentMethods = ['CASH', 'BANK_TRANSFER'] as const

export const createDonationSchema = z.object({
  amount: z.number().min(0.01, 'El monto debe ser al menos 0.01'),
  donationDate: z.string().min(1, 'La fecha es obligatoria'),
  donationType: z.enum(donationTypes, {
    error: 'Seleccione un tipo de donación',
  }),
  paymentMethod: z.enum(paymentMethods, {
    error: 'Seleccione un método de pago',
  }),
  donorId: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateDonationFormData = z.infer<typeof createDonationSchema>
