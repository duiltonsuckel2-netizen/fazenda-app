import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]',
        'animate-[shimmer_1.5s_ease-in-out_infinite]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
