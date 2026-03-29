'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { encaminhamentoSchema, camposPorEtapa, type EncaminhamentoFormData } from '@/lib/validations/encaminhamento.schema'
import { criarEncaminhamento, atualizarEncaminhamento } from '@/lib/actions/encaminhamentos'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StepperIndicator } from '@/components/stepper/stepper-indicator'
import { useStepper } from '@/components/stepper/use-stepper'
import { Step01Instituicao } from './steps/step-01-instituicao'
import { Step02Causa } from './steps/step-02-causa'
import { Step03Identificacao } from './steps/step-03-identificacao'
import { Step04Atendimento } from './steps/step-04-atendimento'
import { Step05Revisao } from './steps/step-05-revisao'
import type { FieldPath } from 'react-hook-form'

const ETAPAS = [
  { label: 'Instituição', descricao: 'Dados da instituição e médico' },
  { label: 'Causa', descricao: 'Causa da morte' },
  { label: 'Identificação', descricao: 'Dados do falecido' },
  { label: 'Atendimento', descricao: 'Dados clínicos' },
  { label: 'Revisão', descricao: 'Confirmar dados' },
]

const CAMPOS_POR_ETAPA: Record<number, FieldPath<EncaminhamentoFormData>[]> = {
  0: camposPorEtapa[0] as FieldPath<EncaminhamentoFormData>[],
  1: camposPorEtapa[1] as FieldPath<EncaminhamentoFormData>[],
  2: camposPorEtapa[2] as FieldPath<EncaminhamentoFormData>[],
  3: camposPorEtapa[3] as FieldPath<EncaminhamentoFormData>[],
  4: [],
}

interface Props {
  encaminhamentoId?: string
  defaultValues?: Partial<EncaminhamentoFormData>
}

export function EncaminhamentoForm({ encaminhamentoId, defaultValues }: Props) {
  const router = useRouter()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<EncaminhamentoFormData>({
    resolver: zodResolver(encaminhamentoSchema) as any,
    defaultValues: {
      identificado: true,
      recebeu_atendimento: false,
      motivo: 'morte_violenta',
      sexo: 'indeterminado',
      cidade_preenchimento: 'Manaus',
      data_preenchimento: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    } as any,
    mode: 'onChange',
  })

  const stepper = useStepper({
    totalSteps: ETAPAS.length,
    form,
    camposPorEtapa: CAMPOS_POR_ETAPA,
  })

  async function handleSubmit(data: EncaminhamentoFormData) {
    const resultado = encaminhamentoId
      ? await atualizarEncaminhamento(encaminhamentoId, data)
      : await criarEncaminhamento(data)

    if ('erro' in resultado) {
      toast.error(resultado.erro)
      return
    }

    const id = 'id' in resultado ? resultado.id : encaminhamentoId
    toast.success(
      encaminhamentoId ? 'Encaminhamento atualizado.' : 'Rascunho salvo com sucesso.'
    )
    router.push(`/encaminhamentos/${id}`)
  }

  const etapaAtiva = stepper.etapaAtual

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <StepperIndicator
        etapas={ETAPAS}
        etapaAtual={stepper.etapaAtual}
        etapasValidas={stepper.etapasValidas}
        onIrPara={stepper.irPara}
        progresso={stepper.progresso}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardContent className="pt-6">
              {etapaAtiva === 0 && <Step01Instituicao form={form} />}
              {etapaAtiva === 1 && <Step02Causa form={form} />}
              {etapaAtiva === 2 && <Step03Identificacao form={form} />}
              {etapaAtiva === 3 && <Step04Atendimento form={form} />}
              {etapaAtiva === 4 && <Step05Revisao form={form} />}
            </CardContent>
          </Card>

          {/* Navegação */}
          <div className="flex justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={stepper.voltar}
              disabled={stepper.isPrimeiraEtapa}
            >
              Anterior
            </Button>

            {stepper.isUltimaEtapa ? (
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={async () => {
                  const campos = CAMPOS_POR_ETAPA[stepper.etapaAtual] ?? []
                  const valido = await form.trigger(campos as never)
                  if (!valido) {
                    // Mostra toast com os erros
                    const erros = form.formState.errors
                    const mensagens = Object.entries(erros)
                      .filter(([key]) => campos.includes(key as never))
                      .map(([, value]) => value?.message)
                      .filter(Boolean)
                      .slice(0, 3) // Mostra no máximo 3 erros
                    
                    if (mensagens.length > 0) {
                      toast.error('Preencha os campos obrigatórios:', {
                        description: mensagens.join('\n'),
                      })
                    }
                  }
                  stepper.avancar()
                }}
              >
                Próximo
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
