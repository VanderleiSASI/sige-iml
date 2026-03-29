'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Plus, Search, MapPin, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { listarInstituicoes, criarInstituicao, atualizarInstituicao } from '@/lib/actions/admin'
import type { Database } from '@/lib/types/database.types'

type Instituicao = Database['public']['Tables']['instituicoes']['Row']
type TipoInstituicao = Database['public']['Enums']['tipo_instituicao']

const tipoLabel: Record<TipoInstituicao, string> = {
  hospital_ps: 'Hospital/Pronto Socorro',
  spa: 'SPA',
  maternidade: 'Maternidade',
  outro: 'Outro',
}

export default function InstituicoesPage() {
  const router = useRouter()
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [instituicaoEditando, setInstituicaoEditando] = useState<Instituicao | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'hospital_ps' as TipoInstituicao,
    tipo_outro: '',
    endereco: '',
    municipio: 'Manaus',
    uf: 'AM',
    telefone: '',
    responsavel_tecnico: '',
    ativo: true,
  })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const insts = await listarInstituicoes()
    setInstituicoes(insts)
    setCarregando(false)
  }

  const instituicoesFiltradas = instituicoes.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase()) ||
    i.municipio.toLowerCase().includes(busca.toLowerCase())
  )

  function abrirModal(instituicao?: Instituicao) {
    if (instituicao) {
      setInstituicaoEditando(instituicao)
      setFormData({
        nome: instituicao.nome,
        tipo: instituicao.tipo,
        tipo_outro: instituicao.tipo_outro ?? '',
        endereco: instituicao.endereco ?? '',
        municipio: instituicao.municipio,
        uf: instituicao.uf,
        telefone: instituicao.telefone ?? '',
        responsavel_tecnico: instituicao.responsavel_tecnico ?? '',
        ativo: instituicao.ativo,
      })
    } else {
      setInstituicaoEditando(null)
      setFormData({
        nome: '',
        tipo: 'hospital_ps',
        tipo_outro: '',
        endereco: '',
        municipio: 'Manaus',
        uf: 'AM',
        telefone: '',
        responsavel_tecnico: '',
        ativo: true,
      })
    }
    setModalAberto(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome da instituição é obrigatório.')
      return
    }

    const payload = {
      ...formData,
      tipo_outro: formData.tipo === 'outro' ? formData.tipo_outro : null,
      endereco: formData.endereco || null,
      telefone: formData.telefone || null,
      responsavel_tecnico: formData.responsavel_tecnico || null,
    }

    const resultado = instituicaoEditando
      ? await atualizarInstituicao(instituicaoEditando.id, payload)
      : await criarInstituicao(payload)

    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    toast.success(instituicaoEditando ? 'Instituição atualizada.' : 'Instituição criada.')
    setModalAberto(false)
    await carregarDados()
    router.refresh()
  }

  async function toggleAtivo(instituicao: Instituicao) {
    const resultado = await atualizarInstituicao(instituicao.id, { ativo: !instituicao.ativo })
    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }
    toast.success(`Instituição ${instituicao.ativo ? 'desativada' : 'ativada'}.`)
    await carregarDados()
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Instituições
          </h2>
          <p className="text-sm text-muted-foreground">
            {instituicoes.length} instituição(ões) cadastrada(s)
          </p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="w-4 h-4 mr-1" />
          Nova Instituição
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou município..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Município/UF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : instituicoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {busca ? 'Nenhuma instituição encontrada para esta busca' : 'Nenhuma instituição cadastrada'}
                  </TableCell>
                </TableRow>
              ) : (
                instituicoesFiltradas.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tipoLabel[inst.tipo]}
                        {inst.tipo === 'outro' && inst.tipo_outro && ` (${inst.tipo_outro})`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inst.endereco ? (
                        <span className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{inst.endereco}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inst.municipio}/{inst.uf}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inst.telefone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {inst.telefone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {inst.ativo ? (
                        <Badge variant="default" className="bg-green-600">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => abrirModal(inst)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(inst)}
                          className={inst.ativo ? 'text-destructive' : 'text-green-600'}
                        >
                          {inst.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {instituicaoEditando ? 'Editar Instituição' : 'Nova Instituição'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da instituição de saúde.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome da Instituição *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Hospital Municipal Dr. ..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoInstituicao })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  required
                >
                  <option value="hospital_ps">Hospital/Pronto Socorro</option>
                  <option value="spa">SPA</option>
                  <option value="maternidade">Maternidade</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              {formData.tipo === 'outro' && (
                <div>
                  <Label htmlFor="tipo_outro">Especificar Tipo</Label>
                  <Input
                    id="tipo_outro"
                    value={formData.tipo_outro}
                    onChange={(e) => setFormData({ ...formData, tipo_outro: e.target.value })}
                    placeholder="Tipo de instituição"
                  />
                </div>
              )}
              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="uf">UF</Label>
                <select
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                >
                  <option value="AM">AM</option>
                  <option value="AC">AC</option>
                  <option value="RR">RR</option>
                  <option value="RO">RO</option>
                  <option value="PA">PA</option>
                  <option value="AP">AP</option>
                  <option value="TO">TO</option>
                  <option value="MA">MA</option>
                  <option value="PI">PI</option>
                  <option value="CE">CE</option>
                  <option value="RN">RN</option>
                  <option value="PB">PB</option>
                  <option value="PE">PE</option>
                  <option value="AL">AL</option>
                  <option value="SE">SE</option>
                  <option value="BA">BA</option>
                  <option value="MG">MG</option>
                  <option value="ES">ES</option>
                  <option value="RJ">RJ</option>
                  <option value="SP">SP</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                  <option value="RS">RS</option>
                  <option value="MS">MS</option>
                  <option value="MT">MT</option>
                  <option value="GO">GO</option>
                  <option value="DF">DF</option>
                </select>
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(92) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável Técnico</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel_tecnico}
                  onChange={(e) => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {instituicaoEditando ? 'Salvar Alterações' : 'Criar Instituição'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
