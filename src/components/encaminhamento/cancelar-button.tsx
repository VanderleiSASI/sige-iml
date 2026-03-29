'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { cancelarEncaminhamento } from '@/lib/actions/encaminhamentos'

interface Props {
  id: string
}

export function CancelarEncaminhamentoButton({ id }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleCancelar() {
    if (justificativa.trim().length < 10) {
      toast.error('A justificativa deve ter ao menos 10 caracteres.')
      return
    }

    setCarregando(true)
    const resultado = await cancelarEncaminhamento(id, justificativa)
    setCarregando(false)

    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    toast.success('Encaminhamento cancelado.')
    setAberto(false)
    setJustificativa('')
    router.refresh()
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <XCircle className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Encaminhamento</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Informe a justificativa para o cancelamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="justificativa">
            Justificativa <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="justificativa"
            placeholder="Descreva o motivo do cancelamento (mínimo 10 caracteres)..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {justificativa.length} caractere(s) — mínimo 10
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={carregando}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelar}
            disabled={carregando || justificativa.trim().length < 10}
          >
            {carregando ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
