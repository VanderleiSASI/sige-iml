'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { alterarSenha } from '@/lib/actions/perfil'
import { toast } from 'sonner'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.novaSenha !== form.confirmar) {
      toast.error('A nova senha e a confirmação não coincidem.')
      return
    }
    if (form.novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    startTransition(async () => {
      const result = await alterarSenha(form.senhaAtual, form.novaSenha)
      if ('erro' in result) {
        toast.error(result.erro)
      } else {
        toast.success('Senha alterada com sucesso.')
        router.push('/perfil')
      }
    })
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Alterar Senha
        </h2>
        <p className="text-sm text-muted-foreground">Defina uma nova senha para sua conta</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={form.senhaAtual}
                onChange={(e) => setForm({ ...form, senhaAtual: e.target.value })}
                disabled={isPending}
                required
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={form.novaSenha}
                onChange={(e) => setForm({ ...form, novaSenha: e.target.value })}
                disabled={isPending}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar nova senha</Label>
              <Input
                id="confirmar"
                type="password"
                value={form.confirmar}
                onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                disabled={isPending}
                required
                minLength={6}
                placeholder="Repita a nova senha"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Alterando...' : 'Alterar senha'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/perfil')}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
