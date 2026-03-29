import type { Metadata } from 'next'
import { EncaminhamentoForm } from '@/components/encaminhamento/encaminhamento-form'

export const metadata: Metadata = { title: 'Novo Encaminhamento' }

export default function NovoEncaminhamentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Encaminhamento</h1>
        <p className="text-muted-foreground text-sm">
          Preencha todas as etapas para registrar o encaminhamento ao IML.
        </p>
      </div>
      <EncaminhamentoForm />
    </div>
  )
}
