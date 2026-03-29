'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { EncaminhamentoFormData } from '@/lib/validations/encaminhamento.schema'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface Props {
  form: UseFormReturn<EncaminhamentoFormData>
}

export function Step01Instituicao({ form }: Props) {
  const tipoInstituicao = form.watch('instituicao_tipo')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dados da Instituição</h2>
        <p className="text-sm text-muted-foreground">
          Informações sobre o estabelecimento de origem e o médico responsável.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="instituicao_nome"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Nome da Instituição *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Hospital e Pronto-Socorro 28 de Agosto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instituicao_tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Instituição *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hospital_ps">Hospital/PS</SelectItem>
                  <SelectItem value="spa">SPA</SelectItem>
                  <SelectItem value="maternidade">Maternidade</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoInstituicao === 'outro' && (
          <FormField
            control={form.control}
            name="instituicao_tipo_outro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especifique o tipo *</FormLabel>
                <FormControl>
                  <Input placeholder="Descreva o tipo de instituição" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="medico_nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Médico Responsável *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do médico" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medico_crm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CRM *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 12345 ou 12345-AM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="motivo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Motivo do Encaminhamento *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="morte_violenta" id="motivo-violenta" />
                  <Label htmlFor="motivo-violenta" className="cursor-pointer font-normal">
                    Morte Violenta
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="morte_suspeita" id="motivo-suspeita" />
                  <Label htmlFor="motivo-suspeita" className="cursor-pointer font-normal">
                    Morte Suspeita
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
