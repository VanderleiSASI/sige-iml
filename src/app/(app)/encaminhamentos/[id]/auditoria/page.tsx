import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, History, User, FileText } from 'lucide-react'
import { listarAuditoria, getAcaoLabel } from '@/lib/actions/auditoria'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Auditoria do Encaminhamento' }

const acaoBadge: Record<Database['public']['Enums']['acao_auditoria'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  criacao: 'default',
  atualizacao: 'secondary',
  confirmacao: 'default',
  cancelamento: 'destructive',
  recepcao_iml: 'secondary',
  geracao_pdf: 'outline',
  visualizacao: 'outline',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AuditoriaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  const podeVerAuditoria = ['administrador', 'gestor_iml', 'auditor'].includes(usuario?.perfil ?? '')
  if (!podeVerAuditoria) {
    redirect(`/encaminhamentos/${id}`)
  }

  // Buscar encaminhamento
  const { data: enc } = await supabase
    .from('encaminhamentos')
    .select('id, protocolo, status, nome_falecido, created_at')
    .eq('id', id)
    .single() as { data: { id: string; protocolo: string | null; status: string; nome_falecido: string | null; created_at: string } | null }

  if (!enc) notFound()

  // Buscar logs de auditoria
  const logs = await listarAuditoria(id)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LinkButton href={`/encaminhamentos/${id}`} variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </LinkButton>
        </div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="w-6 h-6" />
          Trilha de Auditoria
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Histórico de ações no encaminhamento {enc.protocolo ?? 'Rascunho'}
          {enc.nome_falecido && ` — ${enc.nome_falecido}`}
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Protocolo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-mono font-semibold">{enc.protocolo ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Status Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{enc.status.replace('_', ' ')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total de Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{logs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Registro de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum registro de auditoria encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={acaoBadge[log.acao]}>
                            {getAcaoLabel(log.acao)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {log.usuario_nome ?? 'Sistema'}
                          <span className="text-muted-foreground text-xs ml-1">
                            ({log.usuario_email ?? log.usuario_id?.slice(0, 8) ?? 'N/A'})
                          </span>
                        </p>
                        {log.ip && (
                          <p className="text-xs text-muted-foreground">
                            IP: {log.ip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dados modificados */}
                  {(log.dados_anteriores || log.dados_novos) && (
                    <div className="mt-3 ml-11 p-3 bg-muted/50 rounded text-sm">
                      {log.dados_anteriores && (
                        <div className="mb-2">
                          <p className="text-xs text-destructive font-medium mb-1">Anterior:</p>
                          <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.dados_anteriores, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.dados_novos && (
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">Novo:</p>
                          <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.dados_novos, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {index < logs.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
