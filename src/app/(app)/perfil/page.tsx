'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { KeyRound, Mail, Shield, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { atualizarNome } from '@/lib/actions/perfil'
import { toast } from 'sonner'
import type { PerfilUsuario } from '@/lib/types/database.types'

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

function getIniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}

export default function PerfilPage() {
  const { usuario } = useAuth()
  const [nome, setNome] = useState(usuario.nome)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await atualizarNome(nome)
      if ('erro' in result) {
        toast.error(result.erro)
      } else {
        toast.success('Nome atualizado com sucesso.')
      }
    })
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Meu Perfil
        </h2>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getIniciais(usuario.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">{usuario.nome}</p>
              <Badge variant={perfilBadge[usuario.perfil]} className="mt-1">
                {perfilLabel[usuario.perfil]}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                E-mail
              </Label>
              <Input value={usuario.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Perfil de acesso
              </Label>
              <Input value={perfilLabel[usuario.perfil]} disabled className="bg-muted" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/perfil/alterar-senha" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Alterar senha
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
