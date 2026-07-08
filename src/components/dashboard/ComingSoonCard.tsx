import { Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="mx-auto mt-12 max-w-lg border-dashed">
      <CardHeader className="justify-items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">Coming soon.</CardContent>
    </Card>
  )
}
