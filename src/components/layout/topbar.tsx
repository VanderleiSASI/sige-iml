'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const rotaLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  encaminhamentos: 'Encaminhamentos',
  novo: 'Novo Encaminhamento',
  relatorios: 'Relatórios',
  mensal: 'Relatório Mensal',
  epidemiologico: 'Relatório Epidemiológico',
  produtividade: 'Relatório de Produtividade',
  autoridades: 'Relatório para Autoridades',
  usuarios: 'Usuários',
  instituicoes: 'Instituições',
  auditoria: 'Auditoria',
}

function getIniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario } = useAuth()
  const supabase = createClient()

  const segmentos = pathname.split('/').filter(Boolean)
  const breadcrumbs = segmentos.map((seg, i) => ({
    label: rotaLabels[seg] ?? (seg.length === 36 ? '...' : seg),
    href: '/' + segmentos.slice(0, i + 1).join('/'),
    isLast: i === segmentos.length - 1,
  }))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <nav aria-label="Localização" className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            )}
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <a
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </a>
            )}
          </span>
        ))}
      </nav>

      {/* Ações do usuário */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-4 h-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted transition-colors">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getIniciais(usuario.nome)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:block">{usuario.nome.split(' ')[0]}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{usuario.nome}</p>
                <p className="text-xs text-muted-foreground">{usuario.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sair do sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
