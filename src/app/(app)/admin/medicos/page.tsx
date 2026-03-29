'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Stethoscope, Plus, Search, Building2, Phone, Mail } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { listarMedicos, listarInstituicoesAtivas, criarMedico, atualizarMedico } from '@/lib/actions/admin'
import type { Database } from '@/lib/types/database.types'

type Medico = Database['public']['Tables']['medicos']['Row'] & { instituicoes?: { nome: string } | null }
type Instituicao = Database['public']['Tables']['instituicoes']['Row']

export default function MedicosPage() {
  const router = useRouter()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [medicoEditando, setMedicoEditando] = useState<Medico | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    crm_uf: 'AM',
    especialidade: '',
    contato: '',
    instituicao_id: '',
    ativo: true,
  })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const [meds, insts] = await Promise.all([
      listarMedicos(),
      listarInstituicoesAtivas(),
    ])
    setMedicos(meds as Medico[])
    setInstituicoes(insts)
    setCarregando(false)
  }

  const medicosFiltrados = medicos.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.crm.toLowerCase().includes(busca.toLowerCase())
  )

  function abrirModal(medico?: Medico) {
    if (medico) {
      setMedicoEditando(medico)
      setFormData({
        nome: medico.nome,
        crm: medico.crm,
        crm_uf: medico.crm_uf,
        especialidade: medico.especialidade ?? '',
        contato: medico.contato ?? '',
        instituicao_id: medico.instituicao_id ?? '',
        ativo: medico.ativo,
      })
    } else {
      setMedicoEditando(null)
      setFormData({
        nome: '',
        crm: '',
        crm_uf: 'AM',
        especialidade: '',
        contato: '',
        instituicao_id: '',
        ativo: true,
      })
    }
    setModalAberto(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nome || !formData.crm) {
      toast.error('Nome e CRM são obrigatórios.')
      return
    }

    const payload = {
      ...formData,
      instituicao_id: formData.instituicao_id || null,
      especialidade: formData.especialidade || null,
      contato: formData.contato || null,
    }

    const resultado = medicoEditando
      ? await atualizarMedico(medicoEditando.id, payload)
      : await criarMedico(payload)

    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    toast.success(medicoEditando ? 'Médico atualizado.' : 'Médico criado.')
    setModalAberto(false)
    await carregarDados()
    router.refresh()
  }

  async function toggleAtivo(medico: Medico) {
    const resultado = await atualizarMedico(medico.id, { ativo: !medico.ativo })
    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }
    toast.success(`Médico ${medico.ativo ? 'desativado' : 'ativado'}.`)
    await carregarDados()
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Médicos
          </h2>
          <p className="text-sm text-muted-foreground">
            {medicos.length} médico(s) cadastrado(s)
          </p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="w-4 h-4 mr-1" />
          Novo Médico
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CRM..."
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
                <TableHead>CRM</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Contato</TableHead>
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
              ) : medicosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {busca ? 'Nenhum médico encontrado para esta busca' : 'Nenhum médico cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                medicosFiltrados.map((medico) => (
                  <TableRow key={medico.id}>
                    <TableCell className="font-medium">{medico.nome}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {medico.crm}-{medico.crm_uf}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {medico.especialidade ?? '—'}
                    </TableCell>
                    <TableCell>
                      {medico.instituicoes?.nome ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Building2 className="w-3 h-3" />
                          {medico.instituicoes.nome}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {medico.contato ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {medico.contato}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {medico.ativo ? (
                        <Badge variant="default" className="bg-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => abrirModal(medico)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(medico)}
                          className={medico.ativo ? 'text-destructive' : 'text-green-600'}
                        >
                          {medico.ativo ? 'Desativar' : 'Ativar'}
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
              {medicoEditando ? 'Editar Médico' : 'Novo Médico'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do médico. O CRM deve ser único no sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Dr. João Silva"
                  required
                />
              </div>
              <div>
                <Label htmlFor="crm">CRM *</Label>
                <Input
                  id="crm"
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                  placeholder="12345"
                  required
                />
              </div>
              <div>
                <Label htmlFor="crm_uf">UF do CRM</Label>
                <select
                  id="crm_uf"
                  value={formData.crm_uf}
                  onChange={(e) => setFormData({ ...formData, crm_uf: e.target.value })}
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
              <div className="col-span-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                  placeholder="Clínico Geral, Cirurgião, etc."
                />
              </div>
              <div>
                <Label htmlFor="instituicao">Instituição</Label>
                <select
                  id="instituicao"
                  value={formData.instituicao_id}
                  onChange={(e) => setFormData({ ...formData, instituicao_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                >
                  <option value="">Selecione...</option>
                  {instituicoes.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="contato">Contato</Label>
                <Input
                  id="contato"
                  value={formData.contato}
                  onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                  placeholder="(92) 99999-9999"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {medicoEditando ? 'Salvar Alterações' : 'Criar Médico'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
