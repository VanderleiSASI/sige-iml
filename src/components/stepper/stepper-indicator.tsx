'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface StepConfig {
  label: string
  descricao?: string
}

interface StepperIndicatorProps {
  etapas: StepConfig[]
  etapaAtual: number
  etapasValidas: Set<number>
  onIrPara: (etapa: number) => void
  progresso: number
}

export function StepperIndicator({
  etapas,
  etapaAtual,
  etapasValidas,
  onIrPara,
  progresso,
}: StepperIndicatorProps) {
  return (
    <div className="space-y-4">
      <Progress value={progresso} className="h-1.5" />

      <div className="flex items-start justify-between gap-2">
        {etapas.map((etapa, i) => {
          const concluida = etapasValidas.has(i)
          const ativa = i === etapaAtual
          const navegavel = i <= etapaAtual || etapasValidas.has(i - 1)

          return (
            <button
              key={i}
              type="button"
              onClick={() => navegavel && onIrPara(i)}
              disabled={!navegavel}
              className={cn(
                'flex flex-col items-center gap-1.5 flex-1 text-center transition-opacity',
                !navegavel && 'opacity-40 cursor-not-allowed',
                navegavel && !ativa && 'cursor-pointer hover:opacity-80'
              )}
              aria-current={ativa ? 'step' : undefined}
            >
              {/* Círculo indicador */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  ativa
                    ? 'bg-primary border-primary text-primary-foreground'
                    : concluida
                    ? 'bg-accent border-accent text-accent-foreground'
                    : 'bg-background border-border text-muted-foreground'
                )}
              >
                {concluida && !ativa ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Label — oculto em telas pequenas */}
              <span
                className={cn(
                  'text-xs leading-tight hidden sm:block',
                  ativa ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {etapa.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
