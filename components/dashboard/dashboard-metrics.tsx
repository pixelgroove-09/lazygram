import { Calendar, Clock, Image } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface DashboardMetricsProps {
  scheduledCount: number
  postedCount: number
  uploadedCount: number
}

export default function DashboardMetrics({ scheduledCount, postedCount, uploadedCount }: DashboardMetricsProps) {
  const metrics = [
    {
      title: "Scheduled Posts",
      value: scheduledCount,
      description: "Posts waiting to be published",
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      href: "/?tab=schedule",
      color: "bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Posted",
      value: postedCount,
      description: "Successfully published posts",
      icon: <Clock className="h-5 w-5 text-green-500" />,
      href: "/dashboard?tab=activity",
      color: "bg-green-50 hover:bg-green-100",
    },
    {
      title: "Uploaded Images",
      value: uploadedCount,
      description: "Images ready to be scheduled",
      icon: <Image className="h-5 w-5 text-purple-500" />,
      href: "/",
      color: "bg-purple-50 hover:bg-purple-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <Link key={metric.title} href={metric.href}>
          <Card className={`transition-colors cursor-pointer ${metric.color}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{metric.title}</p>
                  <h3 className="text-3xl font-bold mt-2">{metric.value}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className="p-2 rounded-full bg-white">{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

