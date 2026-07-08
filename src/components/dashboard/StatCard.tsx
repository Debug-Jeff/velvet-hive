import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string | null
  icon: LucideIcon
  isLoading?: boolean
  accent?: 'default' | 'blue' | 'green' | 'amber'
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'bg-primary/10 text-primary',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export default function StatCard({ label, value, icon: Icon, isLoading, accent = 'default' }: StatCardProps) {
  return (
    <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 py-1">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', ACCENT_STYLES[accent])}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? <Skeleton className="mt-1 h-7 w-14" /> : <p className="text-2xl font-semibold tabular-nums">{value ?? '—'}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
