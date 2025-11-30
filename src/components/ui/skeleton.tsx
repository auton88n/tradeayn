import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-background/10 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      style={{
        backgroundSize: '200% 100%'
      }}
      {...props}
    />
  )
}

export { Skeleton }
