import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/layout/auth-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { Toaster } from '@/components/ui/sonner'
import type { UsuarioLogado } from '@/hooks/use-auth'
import type { Database } from '@/lib/types/database.types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil')
    .eq('id', user.id)
    .single() as { data: Database['public']['Tables']['usuarios']['Row'] | null }

  if (!usuario) redirect('/login')

  const usuarioLogado: UsuarioLogado = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  }

  return (
    <AuthProvider usuario={usuarioLogado}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar />
          <main className="flex-1 p-6 bg-muted/30" id="main-content">
            {children}
          </main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}
