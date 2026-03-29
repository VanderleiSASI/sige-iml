'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Download, Trash2, Upload, FileImage, FileArchive, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { listarAnexos, gerarUrlDownload, removerAnexo } from '@/lib/actions/anexos'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Anexo = Database['public']['Tables']['anexos']['Row']
type TipoAnexo = Database['public']['Enums']['tipo_anexo']

const tipoLabel: Record<TipoAnexo, string> = {
  identificacao: 'Identificação',
  exame: 'Exame',
  boletim_ocorrencia: 'Boletim de Ocorrência',
  outro: 'Outro',
}

const tipoBadge: Record<TipoAnexo, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  identificacao: 'default',
  exame: 'secondary',
  boletim_ocorrencia: 'destructive',
  outro: 'outline',
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('pdf')) return FileText
  return File
}

interface Props {
  encaminhamentoId: string
  anexosIniciais: Anexo[]
  podeEditar: boolean
}

export function AnexosList({ encaminhamentoId, anexosIniciais, podeEditar }: Props) {
  const router = useRouter()
  const [anexos, setAnexos] = useState<Anexo[]>(anexosIniciais)
  const [uploading, setUploading] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoAnexo>('outro')
  const supabase = createClient()

  const refreshAnexos = useCallback(async () => {
    const novosAnexos = await listarAnexos(encaminhamentoId)
    setAnexos(novosAnexos)
  }, [encaminhamentoId])

  async function handleDownload(anexoId: string, nomeOriginal: string) {
    const resultado = await gerarUrlDownload(anexoId)
    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    // Criar link temporário para download
    const link = document.createElement('a')
    link.href = resultado.url
    link.download = nomeOriginal
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleRemover(anexoId: string) {
    const resultado = await removerAnexo(anexoId)
    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    toast.success('Anexo removido.')
    await refreshAnexos()
    router.refresh()
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validações
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Limite: 10MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou PDF')
      return
    }

    setUploading(true)

    try {
      // Calcular hash SHA-256
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Upload para o storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${encaminhamentoId}/${Date.now()}_${hashHex.slice(0, 16)}.${fileExt}`

      const { error: uploadError } = await supabase
        .storage
        .from('anexos')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Registrar no banco
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error: dbError } = await supabase
        .from('anexos')
        .insert({
          encaminhamento_id: encaminhamentoId,
          tipo: tipoSelecionado,
          nome_original: file.name,
          storage_path: filePath,
          mime_type: file.type,
          tamanho_bytes: file.size,
          hash_sha256: hashHex,
          uploaded_by: user.id,
        })

      if (dbError) {
        // Rollback: remover do storage
        await supabase.storage.from('anexos').remove([filePath])
        throw new Error(dbError.message)
      }

      toast.success('Arquivo enviado com sucesso!')
      await refreshAnexos()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
      // Limpar input
      event.target.value = ''
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileArchive className="w-4 h-4" />
          Anexos ({anexos.length})
        </CardTitle>
        {podeEditar && (
          <div className="flex items-center gap-2">
            <select
              value={tipoSelecionado}
              onChange={(e) => setTipoSelecionado(e.target.value as TipoAnexo)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="identificacao">Identificação</option>
              <option value="exame">Exame</option>
              <option value="boletim_ocorrencia">Boletim de Ocorrência</option>
              <option value="outro">Outro</option>
            </select>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
              />
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="w-4 h-4 mr-1" />
                  {uploading ? 'Enviando...' : 'Anexar'}
                </span>
              </Button>
            </label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {anexos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum anexo registrado.</p>
            {podeEditar && (
              <p className="text-xs mt-1">Clique em &quot;Anexar&quot; para adicionar arquivos.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {anexos.map((anexo) => {
              const Icon = getFileIcon(anexo.mime_type)
              return (
                <div
                  key={anexo.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-8 h-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{anexo.nome_original}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={tipoBadge[anexo.tipo]} className="text-[10px]">
                          {tipoLabel[anexo.tipo]}
                        </Badge>
                        <span>·</span>
                        <span>{formatarTamanho(anexo.tamanho_bytes)}</span>
                        <span>·</span>
                        <span>{new Date(anexo.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(anexo.id, anexo.nome_original)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {podeEditar && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Anexo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o arquivo &quot;{anexo.nome_original}&quot;?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemover(anexo.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Formatos aceitos: JPG, PNG, WebP, PDF. Tamanho máximo: 10MB.
        </p>
      </CardContent>
    </Card>
  )
}
