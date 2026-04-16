import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 border',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5',
        secondary: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
        destructive: 'bg-red-500/15 text-red-400 border-red-500/20 shadow-sm shadow-red-500/5',
        warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/5',
        info: 'bg-blue-500/15 text-blue-400 border-blue-500/20 shadow-sm shadow-blue-500/5',
        purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20 shadow-sm shadow-purple-500/5',
        orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20 shadow-sm shadow-orange-500/5',
        teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20 shadow-sm shadow-teal-500/5',
        pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20 shadow-sm shadow-pink-500/5',
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
