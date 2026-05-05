"use client"

type TaskStatus = "en_cours" | "termine" | "en_attente" | "urgent"

interface Task {
  id: number
  titre: string
  assigneA: string
  avatar: string
  dateLimite: string
  statut: TaskStatus
}

const tasks: Task[] = [
  {
    id: 1,
    titre: "Rapport de stage mensuel",
    assigneA: "Marie Dupont",
    avatar: "MD",
    dateLimite: "2026-05-10",
    statut: "en_cours",
  },
  {
    id: 2,
    titre: "Évaluation mi-parcours",
    assigneA: "Jean Martin",
    avatar: "JM",
    dateLimite: "2026-05-08",
    statut: "urgent",
  },
  {
    id: 3,
    titre: "Mise à jour du planning",
    assigneA: "Sophie Bernard",
    avatar: "SB",
    dateLimite: "2026-05-15",
    statut: "en_attente",
  },
  {
    id: 4,
    titre: "Réunion de suivi équipe",
    assigneA: "Lucas Petit",
    avatar: "LP",
    dateLimite: "2026-05-07",
    statut: "termine",
  },
  {
    id: 5,
    titre: "Documentation technique",
    assigneA: "Emma Leroy",
    avatar: "EL",
    dateLimite: "2026-05-20",
    statut: "en_cours",
  },
]

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  en_cours: {
    label: "En cours",
    className: "bg-blue-100 text-blue-700",
  },
  termine: {
    label: "Terminé",
    className: "bg-green-100 text-green-700",
  },
  en_attente: {
    label: "En attente",
    className: "bg-amber-100 text-amber-700",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700",
  },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function RecentTasks() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Tâches Récentes</h3>
          <p className="text-sm text-muted-foreground">Les dernières tâches assignées</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
          Voir tous
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigné à
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date limite
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-card-foreground">{task.titre}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {task.avatar}
                    </div>
                    <span className="text-sm text-muted-foreground">{task.assigneA}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{formatDate(task.dateLimite)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[task.statut].className}`}>
                    {statusConfig[task.statut].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="font-medium text-card-foreground">{task.titre}</span>
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[task.statut].className}`}>
                {statusConfig[task.statut].label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {task.avatar}
              </div>
              <span className="text-sm text-muted-foreground">{task.assigneA}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Date limite:</span> {formatDate(task.dateLimite)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
