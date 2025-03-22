interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

// Add a default export that points to the named export
export default PageHeader

