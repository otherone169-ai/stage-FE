"use client"

export function DashboardHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              SH
            </div>
            <span className="text-xl font-bold text-card-foreground hidden sm:block">StageHub</span>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <a href="#" className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg">
              Tableau de bord
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground hover:bg-muted rounded-lg transition-colors">
              Stagiaires
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground hover:bg-muted rounded-lg transition-colors">
              Stages
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground hover:bg-muted rounded-lg transition-colors">
              Rapports
            </a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-card-foreground hover:bg-muted rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-card-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">Gestionnaire</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
