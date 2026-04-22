import { z } from 'zod/v4'

const emptyToNull = z
  .string()
  .transform((v) => (v === '' ? null : v))
  .pipe(z.string().email('Email no válido').nullable())

export const createDonorSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio'),
  dniNie: z.string().min(1, 'El DNI/NIE es obligatorio'),
  email: emptyToNull.optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

export type CreateDonorFormData = z.infer<typeof createDonorSchema>
