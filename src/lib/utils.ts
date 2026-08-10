import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge only knows Tailwind's built-in font-size names, so it reads
// text-display-md as a text-colour utility and leaves a competing text-base in
// place. Registering the DESIGN.md scale lets it resolve the conflict.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xxl',
            'display-xl',
            'display-lg',
            'display-md',
            'heading-lg',
            'heading-md',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
