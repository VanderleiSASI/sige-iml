import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LinkButton } from '@/components/ui/link-button'
import { Users, Stethoscope, Building2, BarChart3 } from 'lucide-react'

export const metadata: Metadata = { title: 'Administração' }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: string } | null }

  const isAdmin = usuario?.perfil === 'administrador'
  const isGestor = usuario?.perfil === 'gestor_iml'

  if (!isAdmin && !isGestor) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie usuários, médicos e instituições do sistema
        </p>
      </div>

      {/* Tabs de navegação */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <LinkButton href="/admin/usuarios" variant="ghost" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Usuários
        </LinkButton>
        <LinkButton href="/admin/medicos" variant="ghost" size="sm">
          <Stethoscope className="w-4 h-4 mr-2" />
          Médicos
        </LinkButton>
        {isAdmin && (
          <LinkButton href="/admin/instituicoes" variant="ghost" size="sm">
            <Building2 className="w-4 h-4 mr-2" />
            Instituições
          </LinkButton>
        )}
      </div>

      {children}
    </div>
  )
}
