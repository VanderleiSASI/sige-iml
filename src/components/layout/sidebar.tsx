'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  Building2,
  Shield,
  LogOut,
  Settings,
  Stethoscope,
  History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import type { PerfilUsuario } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  perfis: PerfilUsuario[] | 'todos'
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    perfis: 'todos',
  },
  {
    href: '/encaminhamentos',
    label: 'Encaminhamentos',
    icon: FileText,
    perfis: 'todos',
  },
]

const adminItems: NavItem[] = [
  {
    href: '/admin/usuarios',
    label: 'Administração',
    icon: Settings,
    perfis: ['administrador', 'gestor_iml'],
  },
]

const auditoriaItems: NavItem[] = [
  {
    href: '/auditoria',
    label: 'Auditoria',
    icon: History,
    perfis: ['administrador', 'gestor_iml', 'auditor'],
  },
]

const perfilLabel: Record<PerfilUsuario, string> = {
  administrador: 'Administrador',
  gestor_iml: 'Gestor IML',
  medico: 'Médico',
  auditor: 'Auditor',
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario } = useAuth()
  const supabase = createClient()

  const itensFiltrados = navItems.filter(
    (item) =>
      item.perfis === 'todos' ||
      (item.perfis as PerfilUsuario[]).includes(usuario.perfil)
  )

  const adminItemsFiltrados = adminItems.filter(
    (item) =>
      item.perfis === 'todos' ||
      (item.perfis as PerfilUsuario[]).includes(usuario.perfil)
  )

  const auditoriaItemsFiltrados = auditoriaItems.filter(
    (item) =>
      item.perfis === 'todos' ||
      (item.perfis as PerfilUsuario[]).includes(usuario.perfil)
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAdminPath = pathname.startsWith('/admin')

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold shrink-0">
            IML
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">SIGE-IML</p>
            <p className="text-xs text-sidebar-foreground/60 leading-tight">
              Amazonas
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navegação Principal */}
      <nav className="flex-1 p-3 space-y-1" aria-label="Navegação principal">
        {itensFiltrados.map((item) => {
          const Icon = item.icon
          const ativo = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                ativo
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
              aria-current={ativo ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}

        {/* Auditoria Section */}
        {auditoriaItemsFiltrados.length > 0 && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <p className="px-3 text-xs text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Auditoria
            </p>
            {auditoriaItemsFiltrados.map((item) => {
              const Icon = item.icon
              const ativo = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    ativo
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                  aria-current={ativo ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}

        {/* Admin Section */}
        {adminItemsFiltrados.length > 0 && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <p className="px-3 text-xs text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Administração
            </p>
            {adminItemsFiltrados.map((item) => {
              const Icon = item.icon
              const ativo = isAdminPath

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    ativo
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                  aria-current={ativo ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Usuário + logout */}
      <div className="p-4 space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium truncate">{usuario.nome}</p>
          <p className="text-xs text-sidebar-foreground/60">
            {perfilLabel[usuario.perfil]}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
