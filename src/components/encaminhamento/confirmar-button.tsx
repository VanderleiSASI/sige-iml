'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { confirmarEncaminhamento } from '@/lib/actions/encaminhamentos'

interface Props {
  id: string
}

export function ConfirmarEncaminhamentoButton({ id }: Props) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)

  async function handleConfirmar() {
    setCarregando(true)
    const resultado = await confirmarEncaminhamento(id)
    setCarregando(false)

    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    toast.success('Encaminhamento confirmado!', {
      description: `Protocolo: ${resultado.protocolo}`,
    })
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="default" disabled={carregando}>
          <CheckCircle className="w-4 h-4 mr-1" />
          Confirmar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Encaminhamento</AlertDialogTitle>
          <AlertDialogDescription>
            Ao confirmar, será gerado o protocolo oficial (IML-AAAA-NNNNNN) e o hash de
            integridade. O encaminhamento não poderá mais ser editado após a confirmação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmar} disabled={carregando}>
            {carregando ? 'Confirmando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
