import { listProjects } from "@/server/queries/projects"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectCard } from "@/components/projects/project-card"

export default async function ProjectsPage() {
  const projects = await listProjects()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Проекты</h1>
        <ProjectForm />
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Пока нет проектов. Создайте первый.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
