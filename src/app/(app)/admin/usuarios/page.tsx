'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, Mail, Shield, UserX, Plus, Pencil, Key, Search, Send } from 'lucide-react'
import { criarUsuario, convidarUsuario, atualizarUsuario, redefinirSenhaUsuario, listarUsuarios } from '@/lib/actions/admin'
import { toast } from 'sonner'
import type { Database } from '@/lib/types/database.types'

type PerfilUsuario = Database['public']['Enums']['perfil_usuario']

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  ativo: boolean
  ultimo_login: string | null
  created_at: string
}

const perfilLabel: Record<PerfilUsuario, string> = {
  administrador: 'Administrador',
  gestor_iml: 'Gestor IML',
  medico: 'Médico',
  auditor: 'Auditor',
}

const perfilBadge: Record<PerfilUsuario, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  administrador: 'destructive',
  gestor_iml: 'default',
  medico: 'secondary',
  auditor: 'outline',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  
  // Form states
  const [modoConvite, setModoConvite] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    perfil: 'medico' as PerfilUsuario,
  })
  const [passwordData, setPasswordData] = useState({
    novaSenha: '',
    confirmarSenha: '',
  })

  // Load users on mount
  useEffect(() => {
    loadUsuarios()
  }, [])

  async function loadUsuarios() {
    const data = await listarUsuarios()
    setUsuarios(data as Usuario[])
  }

  const filteredUsuarios = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const result = modoConvite
      ? await convidarUsuario({ nome: formData.nome, email: formData.email, perfil: formData.perfil })
      : await criarUsuario(formData)

    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      if (modoConvite && 'avisoEmail' in result && result.avisoEmail) {
        toast.warning(`Usuário criado, mas o email não foi enviado: ${result.avisoEmail}`)
      } else {
        toast.success(modoConvite ? 'Convite enviado por e-mail.' : 'Usuário criado com sucesso.')
      }
      setIsCreateOpen(false)
      setFormData({ nome: '', email: '', password: '', perfil: 'medico' })
      setModoConvite(false)
      loadUsuarios()
    }

    setIsLoading(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    
    setIsLoading(true)
    
    const result = await atualizarUsuario(selectedUser.id, {
      nome: formData.nome,
      perfil: formData.perfil,
    })
    
    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      toast.success('Usuário atualizado com sucesso.')
      setIsEditOpen(false)
      setSelectedUser(null)
      loadUsuarios()
    }
    
    setIsLoading(false)
  }

  async function handleToggleAtivo(usuario: Usuario) {
    const result = await atualizarUsuario(usuario.id, {
      ativo: !usuario.ativo,
    })
    
    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      toast.success(`Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso.`)
      loadUsuarios()
    }
  }

  async function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    
    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      toast.error('As senhas não coincidem.')
      return
    }
    
    if (passwordData.novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    
    setIsLoading(true)
    
    const result = await redefinirSenhaUsuario(selectedUser.id, passwordData.novaSenha)
    
    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      toast.success('Senha redefinida com sucesso.')
      setIsPasswordOpen(false)
      setPasswordData({ novaSenha: '', confirmarSenha: '' })
      setSelectedUser(null)
    }
    
    setIsLoading(false)
  }

  function openEditModal(usuario: Usuario) {
    setSelectedUser(usuario)
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      password: '',
      perfil: usuario.perfil,
    })
    setIsEditOpen(true)
  }

  function openPasswordModal(usuario: Usuario) {
    setSelectedUser(usuario)
    setPasswordData({ novaSenha: '', confirmarSenha: '' })
    setIsPasswordOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários do Sistema
          </h2>
          <p className="text-sm text-muted-foreground">
            {usuarios.length} usuário(s) cadastrado(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Apenas administradores
          </span>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {/* Seletor de modo */}
                <div className="grid grid-cols-2 gap-1 rounded-md border p-1 bg-muted">
                  <button
                    type="button"
                    onClick={() => setModoConvite(false)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      !modoConvite
                        ? 'bg-white shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Senha manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoConvite(true)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      modoConvite
                        ? 'bg-white shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Convidar por e-mail
                  </button>
                </div>

                {modoConvite && (
                  <p className="text-xs text-muted-foreground">
                    O usuário receberá um e-mail com link para definir sua própria senha.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@email.com"
                    required
                  />
                </div>
                {!modoConvite && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha inicial *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil *</Label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(v) => setFormData({ ...formData, perfil: v as PerfilUsuario })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="gestor_iml">Gestor IML</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setModoConvite(false) }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading
                      ? (modoConvite ? 'Enviando...' : 'Criando...')
                      : (modoConvite ? 'Enviar Convite' : 'Criar Usuário')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-[180px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {searchTerm ? 'Nenhum usuário encontrado para esta busca' : 'Nenhum usuário encontrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={perfilBadge[u.perfil]}>
                        {perfilLabel[u.perfil]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.ativo ? (
                        <Badge variant="default" className="bg-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(u)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPasswordModal(u)}
                          title="Redefinir senha"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={u.ativo ? 'text-orange-600' : 'text-green-600'}
                            >
                              {u.ativo ? 'Desativar' : 'Ativar'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {u.ativo ? 'Desativar usuário?' : 'Ativar usuário?'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {u.ativo 
                                  ? `O usuário "${u.nome}" não poderá mais acessar o sistema até ser reativado.`
                                  : `O usuário "${u.nome}" poderá acessar o sistema normalmente.`
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleToggleAtivo(u)}
                                className={u.ativo ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
                              >
                                {u.ativo ? 'Desativar' : 'Ativar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome completo *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-perfil">Perfil *</Label>
              <Select
                value={formData.perfil}
                onValueChange={(v) => setFormData({ ...formData, perfil: v as PerfilUsuario })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="gestor_iml">Gestor IML</SelectItem>
                  <SelectItem value="medico">Médico</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRedefinirSenha} className="space-y-4">
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">{selectedUser?.nome}</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova senha *</Label>
              <Input
                id="nova-senha"
                type="password"
                value={passwordData.novaSenha}
                onChange={(e) => setPasswordData({ ...passwordData, novaSenha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar senha *</Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={passwordData.confirmarSenha}
                onChange={(e) => setPasswordData({ ...passwordData, confirmarSenha: e.target.value })}
                placeholder="Digite novamente a senha"
                minLength={6}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">Informações sobre perfis:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li><strong>Administrador:</strong> Acesso total ao sistema, gerenciamento de usuários e configurações</li>
          <li><strong>Gestor IML:</strong> Acesso à leitura total e validação de fichas, gerenciamento de médicos</li>
          <li><strong>Médico:</strong> Criação e edição apenas de seus próprios encaminhamentos em rascunho</li>
          <li><strong>Auditor:</strong> Acesso somente leitura para fins de auditoria e compliance</li>
        </ul>
      </div>
    </div>
  )
}
