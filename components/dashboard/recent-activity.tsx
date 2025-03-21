"use client"

import { useState } from "react"
import { Clock, ExternalLink, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface PostedImage {
  id: string
  url: string
  caption: string
  hashtags: string[]
  postedAt: string
}

interface RecentActivityProps {
  postedImages: PostedImage[]
}

export default function RecentActivity({ postedImages }: RecentActivityProps) {
  const router = useRouter()
  const [selectedPost, setSelectedPost] = useState<PostedImage | null>(null)

  // Sort posts by posted time (most recent first)
  const sortedPosts = [...postedImages].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())

  // Format date for display
  const formatPostedDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const postedDate = new Date(dateString)
    const diffMs = now.getTime() - postedDate.getTime()

    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    }
  }

  if (sortedPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No posts have been published yet.</p>
            <Button className="mt-4" onClick={() => router.push("/?tab=schedule")}>
              Schedule Posts
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedPosts.map((post) => (
            <div key={post.id} className="flex items-start space-x-4 pb-6 border-b last:border-0 last:pb-0">
              <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img src={post.url || "/placeholder.svg"} alt="Posted content" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{post.caption}</p>
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatPostedDate(post.postedAt)}</span>
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                    {getTimeAgo(post.postedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.hashtags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {post.hashtags.length > 3 && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">+{post.hashtags.length - 3} more</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedPost(post)}>
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Post details dialog */}
        <Dialog open={selectedPost !== null} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Posted to Instagram</DialogTitle>
              <DialogDescription>
                This post was published to Instagram on {selectedPost && formatPostedDate(selectedPost.postedAt)}
              </DialogDescription>
            </DialogHeader>

            {selectedPost && (
              <div className="py-4">
                <div className="flex flex-col space-y-4">
                  <div className="mx-auto w-full max-w-xs rounded-md overflow-hidden bg-muted">
                    <img
                      src={selectedPost.url || "/placeholder.svg"}
                      alt="Posted content"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm mb-2">{selectedPost.caption}</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setSelectedPost(null)}>
                    Close
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={selectedPost.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Image
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

