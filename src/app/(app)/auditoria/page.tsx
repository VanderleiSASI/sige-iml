import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { History, Eye, ArrowLeft, FileText, User, Clock } from 'lucide-react'
import { listarAuditoriaGeral, getAcaoLabel } from '@/lib/actions/auditoria'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Auditoria Geral' }

const acaoBadge: Record<Database['public']['Enums']['acao_auditoria'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  criacao: 'default',
  atualizacao: 'secondary',
  confirmacao: 'default',
  cancelamento: 'destructive',
  recepcao_iml: 'secondary',
  geracao_pdf: 'outline',
  visualizacao: 'outline',
}

export default async function AuditoriaGeralPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  // Apenas admin, gestor e auditor podem ver auditoria geral
  if (!['administrador', 'gestor_iml', 'auditor'].includes(usuario?.perfil ?? '')) {
    redirect('/dashboard')
  }

  const logs = await listarAuditoriaGeral(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LinkButton href="/dashboard" variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </LinkButton>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-6 h-6" />
            Auditoria Geral
          </h1>
          <p className="text-muted-foreground text-sm">
            {logs.length} registro(s) de auditoria
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum registro de auditoria encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Encaminhamento</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {log.usuario_nome ?? 'Sistema'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={acaoBadge[log.acao]}>
                        {getAcaoLabel(log.acao)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.encaminhamento_id ? (
                        <Link 
                          href={`/encaminhamentos/${log.encaminhamento_id}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="w-3 h-3" />
                          Ver ficha
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.ip ?? '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">Sobre a Auditoria:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Todas as ações no sistema são registradas automaticamente</li>
          <li>Os logs incluem data, hora, usuário, IP e dados alterados</li>
          <li>Estes registros são imutáveis e servem para compliance</li>
          <li>Para ver detalhes completos de um encaminhamento, clique em &quot;Ver ficha&quot;</li>
        </ul>
      </div>
    </div>
  )
}
