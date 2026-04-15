import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50',
      'hover:border-white/20 hover:bg-white/[0.07]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[&>option]:bg-gray-900 [&>option]:text-white',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

export { Select }
