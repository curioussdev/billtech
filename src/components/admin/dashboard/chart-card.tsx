import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ChartCard({ title, description, delay = 0, children }: { title: string; description: string; delay?: number; children: React.ReactNode }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Reveal>
  )
}
