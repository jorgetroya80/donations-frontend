import { z } from 'zod/v4'

export const userRoles = ['ADMIN', 'TREASURER', 'PASTOR', 'OPERATOR'] as const

export const createUserSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es obligatorio'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  roles: z.array(z.enum(userRoles)).min(1, 'Seleccione al menos un rol'),
  active: z.boolean(),
})

export const updateUserSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es obligatorio'),
  password: z
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .optional()
    ),
  roles: z.array(z.enum(userRoles)).min(1, 'Seleccione al menos un rol'),
  active: z.boolean(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
