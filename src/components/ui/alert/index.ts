import { type VariantProps, cva } from 'class-variance-authority'

export { default as Alert } from './Alert.vue'
export { default as AlertTitle } from './AlertTitle.vue'
export { default as AlertDescription } from './AlertDescription.vue'

export const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        error: 'bg-red-1 border-red-2 [&>h5]:text-red-8',
        warning: 'bg-yellow-1 border-yellow-2 [&>h5]:text-yellow-8',
        success: 'bg-green-1 border-green-2 [&>h5]:text-green-8',
        info: 'bg-blue-1 border-blue-2 [&>h5]:text-blue-8',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
