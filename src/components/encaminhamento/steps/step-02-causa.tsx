'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { EncaminhamentoFormData } from '@/lib/validations/encaminhamento.schema'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  form: UseFormReturn<EncaminhamentoFormData>
}

const causasViolentas = [
  { value: 'acidente_transito', label: 'Acidente de Trânsito' },
  { value: 'espancamento', label: 'Agressão Física' },
  { value: 'arma_branca', label: 'Arma Branca' },
  { value: 'arma_de_fogo', label: 'Arma de Fogo' },
  { value: 'asfixia', label: 'Asfixia' },
  { value: 'afogamento', label: 'Afogamento' },
  { value: 'queimadura', label: 'Queimadura' },
  { value: 'outros', label: 'Outros' },
] as const

const substanciasEnvenenamento = [
  { value: 'alcool', label: 'Álcool' },
  { value: 'maconha', label: 'Maconha' },
  { value: 'cocaina', label: 'Cocaína' },
  { value: 'oxi_crack', label: 'Oxi/Crack' },
  { value: 'medicamento', label: 'Medicamento(s)' },
  { value: 'outro', label: 'Outro(s)' },
]

export function Step02Causa({ form }: Props) {
  const motivo = form.watch('motivo')
  const causaPrincipal = form.watch('causa_principal')
  const substancias = (form.watch('envenenamento_substancias') as string[] | undefined) ?? []

  function toggleSubstancia(value: string) {
    const atuais = substancias
    const novas = atuais.includes(value)
      ? atuais.filter((s) => s !== value)
      : [...atuais, value]
    form.setValue('envenenamento_substancias', novas as never)
  }

  if (motivo === 'morte_suspeita') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Suspeita de Envenenamento/Intoxicação</h2>
          <p className="text-sm text-muted-foreground">
            Selecione as substâncias suspeitas e descreva a suspeita criminal.
          </p>
        </div>

        <div className="space-y-3">
          <FormLabel>Substâncias Suspeitas *</FormLabel>
          <div className="grid grid-cols-2 gap-3">
            {substanciasEnvenenamento.map((sub) => (
              <div key={sub.value} className="flex items-center gap-2">
                <Checkbox
                  id={`sub-${sub.value}`}
                  checked={substancias.includes(sub.value)}
                  onCheckedChange={() => toggleSubstancia(sub.value)}
                />
                <Label htmlFor={`sub-${sub.value}`} className="cursor-pointer font-normal">
                  {sub.label}
                </Label>
              </div>
            ))}
          </div>
          {form.formState.errors.envenenamento_substancias && (
            <p className="text-sm text-destructive">
              {String(form.formState.errors.envenenamento_substancias.message)}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="descricao_suspeita"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Suspeita Criminal *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva as circunstâncias e suspeitas que motivaram o encaminhamento..."
                  rows={4}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>Mínimo 20 caracteres</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Causa da Morte Violenta</h2>
        <p className="text-sm text-muted-foreground">
          Selecione a causa principal. Campos adicionais aparecerão conforme a seleção.
        </p>
      </div>

      <FormField
        control={form.control}
        name="causa_principal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Causa Principal *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-2 gap-3"
              >
                {causasViolentas.map((causa) => (
                  <div key={causa.value} className="flex items-center gap-2">
                    <RadioGroupItem value={causa.value} id={`causa-${causa.value}`} />
                    <Label htmlFor={`causa-${causa.value}`} className="cursor-pointer font-normal">
                      {causa.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {causaPrincipal === 'asfixia' && (
        <FormField
          control={form.control}
          name="subtipo_asfixia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtipo de Asfixia *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subtipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="enforcamento">Enforcamento</SelectItem>
                  <SelectItem value="estrangulamento">Estrangulamento</SelectItem>
                  <SelectItem value="esganadura">Esganadura</SelectItem>
                  <SelectItem value="afogamento">Afogamento</SelectItem>
                  <SelectItem value="soterramento">Soterramento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {causaPrincipal && causaPrincipal !== 'arma_de_fogo' && (
        <FormField
          control={form.control}
          name="causa_detalhes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detalhes da Causa</FormLabel>
              <FormControl>
                <Input
                  placeholder="Especifique detalhes adicionais sobre a causa..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {causaPrincipal === 'arma_de_fogo' && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <strong>Atenção:</strong> Para causa &quot;Arma de Fogo&quot;, campos adicionais
          (exames de imagem, cirurgia e projéteis) serão obrigatórios na próxima etapa.
        </div>
      )}
    </div>
  )
}
