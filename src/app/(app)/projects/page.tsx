import { FolderKanban } from "lucide-react"

import { listProjects } from "@/server/queries/projects"
import { listClients } from "@/server/queries/clients"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectCard } from "@/components/projects/project-card"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const [projects, clients, sp] = await Promise.all([listProjects(), listClients(), searchParams])
  const clientOpts = clients.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Проекты"
        description="Группируйте задачи и считайте время по проектам"
        actions={<ProjectForm clients={clientOpts} defaultOpen={sp.new === "1"} />}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Пока нет проектов"
          description="Создайте первый проект, чтобы группировать задачи и вести учёт времени."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
