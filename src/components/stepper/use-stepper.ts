'use client'

import { useState, useCallback } from 'react'
import type { UseFormReturn, FieldValues, FieldPath } from 'react-hook-form'

interface UseStepperOptions<T extends FieldValues> {
  totalSteps: number
  form: UseFormReturn<T>
  camposPorEtapa: Record<number, FieldPath<T>[]>
}

export function useStepper<T extends FieldValues>({
  totalSteps,
  form,
  camposPorEtapa,
}: UseStepperOptions<T>) {
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [etapasValidas, setEtapasValidas] = useState<Set<number>>(new Set())

  const isUltimaEtapa = etapaAtual === totalSteps - 1
  const isPrimeiraEtapa = etapaAtual === 0
  const progresso = Math.round(((etapaAtual + 1) / totalSteps) * 100)

  const avancar = useCallback(async () => {
    const campos = camposPorEtapa[etapaAtual] ?? []
    const valido = await form.trigger(campos, { shouldFocus: true })

    if (valido) {
      setEtapasValidas((prev) => new Set(prev).add(etapaAtual))
      setEtapaAtual((e) => Math.min(e + 1, totalSteps - 1))
    }
  }, [etapaAtual, camposPorEtapa, form, totalSteps])

  const voltar = useCallback(() => {
    setEtapaAtual((e) => Math.max(e - 1, 0))
  }, [])

  const irPara = useCallback(
    (etapa: number) => {
      // Permite navegar apenas para etapas já validadas ou a atual
      if (etapa <= etapaAtual || etapasValidas.has(etapa - 1)) {
        setEtapaAtual(etapa)
      }
    },
    [etapaAtual, etapasValidas]
  )

  return {
    etapaAtual,
    etapasValidas,
    isUltimaEtapa,
    isPrimeiraEtapa,
    progresso,
    avancar,
    voltar,
    irPara,
  }
}
