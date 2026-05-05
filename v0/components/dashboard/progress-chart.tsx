"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { mois: "Jan", stagiaires: 12, taches: 45 },
  { mois: "Fév", stagiaires: 19, taches: 62 },
  { mois: "Mar", stagiaires: 25, taches: 78 },
  { mois: "Avr", stagiaires: 32, taches: 95 },
  { mois: "Mai", stagiaires: 28, taches: 88 },
  { mois: "Juin", stagiaires: 35, taches: 110 },
]

export function ProgressChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Progression des Stages</h3>
        <p className="text-sm text-muted-foreground">Évolution mensuelle des stagiaires et tâches</p>
      </div>
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Stagiaires</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Tâches complétées</span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStagiaires" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.55 0.2 250)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.55 0.2 250)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTaches" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
            <XAxis
              dataKey="mois"
              tick={{ fill: "oklch(0.5 0.02 250)", fontSize: 12 }}
              axisLine={{ stroke: "oklch(0.9 0.01 250)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "oklch(0.5 0.02 250)", fontSize: 12 }}
              axisLine={{ stroke: "oklch(0.9 0.01 250)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(1 0 0)",
                border: "1px solid oklch(0.9 0.01 250)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "oklch(0.2 0.02 250)", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="stagiaires"
              stroke="oklch(0.55 0.2 250)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStagiaires)"
              name="Stagiaires"
            />
            <Area
              type="monotone"
              dataKey="taches"
              stroke="oklch(0.65 0.18 250)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTaches)"
              name="Tâches"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
