'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
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
import { receberEncaminhamentoIML } from '@/lib/actions/encaminhamentos'

interface Props {
  id: string
  protocolo?: string | null
}

export function ReceberIMLButton({ id, protocolo }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleReceber() {
    setIsLoading(true)
    
    const resultado = await receberEncaminhamentoIML(id)
    
    if ('erro' in resultado) {
      toast.error(resultado.erro)
    } else {
      toast.success('Encaminhamento recebido no IML!', {
        description: `Protocolo ${protocolo ?? id} registrado como recebido.`,
      })
      router.refresh()
    }
    
    setIsLoading(false)
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Receber no IML
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Recebimento no IML</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja confirmar o recebimento deste encaminhamento no IML?
            <br /><br />
            <strong>Protocolo:</strong> {protocolo ?? 'N/A'}
            <br /><br />
            Esta ação não poderá ser desfeita e registrará na auditoria que o corpo foi recebido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReceber}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processando...' : 'Confirmar Recebimento'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
