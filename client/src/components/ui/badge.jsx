import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        secondary: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
        destructive: 'bg-red-500/15 text-red-400 border-red-500/20',
        warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
        orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
        teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
        pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
        outline: 'border-white/20 text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
