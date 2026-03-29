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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Props {
  form: UseFormReturn<EncaminhamentoFormData>
}

function SimNaoField({
  name,
  label,
  form,
}: {
  name: keyof EncaminhamentoFormData
  label: string
  form: UseFormReturn<EncaminhamentoFormData>
}) {
  const value = form.watch(name) as boolean | undefined

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label} *</Label>
      <RadioGroup
        value={value === true ? 'sim' : value === false ? 'nao' : ''}
        onValueChange={(v) => form.setValue(name, (v === 'sim') as never)}
        className="flex gap-6"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="sim" id={`${String(name)}-sim`} />
          <Label htmlFor={`${String(name)}-sim`} className="font-normal cursor-pointer">Sim</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="nao" id={`${String(name)}-nao`} />
          <Label htmlFor={`${String(name)}-nao`} className="font-normal cursor-pointer">Não</Label>
        </div>
      </RadioGroup>
      {form.formState.errors[name] && (
        <p className="text-sm text-destructive">
          {String(form.formState.errors[name]?.message)}
        </p>
      )}
    </div>
  )
}

export function Step04Atendimento({ form }: Props) {
  const causaPrincipal = form.watch('causa_principal')
  const recebeuAtendimento = form.watch('recebeu_atendimento')
  const armaFogoExame = form.watch('arma_fogo_exame_imagem')
  const armaFogoProjeteis = form.watch('arma_fogo_projeteis_loc')
  const isArmaFogo = causaPrincipal === 'arma_de_fogo'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dados do Atendimento</h2>
        <p className="text-sm text-muted-foreground">
          Informações sobre o atendimento médico e dados do óbito.
        </p>
      </div>

      {/* Datas do óbito */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="data_obito"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Óbito *</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hora_obito"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hora do Óbito *</FormLabel>
              <FormControl>
                <Input type="time" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Atendimento hospitalar */}
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        <Switch
          id="recebeu_atendimento"
          checked={recebeuAtendimento ?? false}
          onCheckedChange={(v) => form.setValue('recebeu_atendimento', v as never)}
        />
        <Label htmlFor="recebeu_atendimento" className="font-medium cursor-pointer">
          Recebeu atendimento hospitalar?
        </Label>
      </div>

      {recebeuAtendimento && (
        <div className="grid gap-4 sm:grid-cols-2 pl-4 border-l-2 border-primary/20">
          <FormField
            control={form.control}
            name="data_admissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Admissão</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3">
            <Switch
              id="houve_internacao"
              checked={form.watch('houve_internacao') ?? false}
              onCheckedChange={(v) => form.setValue('houve_internacao', v as never)}
            />
            <Label htmlFor="houve_internacao" className="font-normal cursor-pointer">
              Houve internação?
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="houve_transfusao"
              checked={form.watch('houve_transfusao') ?? false}
              onCheckedChange={(v) => form.setValue('houve_transfusao', v as never)}
            />
            <Label htmlFor="houve_transfusao" className="font-normal cursor-pointer">
              Houve transfusão de hemoderivados?
            </Label>
          </div>

          {form.watch('houve_transfusao') && (
            <FormField
              control={form.control}
              name="descricao_transfusao"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Descrição da Transfusão</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo e quantidade de hemoderivados..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* Campos exclusivos para Arma de Fogo */}
      {isArmaFogo && (
        <div className="space-y-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <p className="text-sm font-semibold text-destructive">
            Campos Obrigatórios — Arma de Fogo
          </p>

          <SimNaoField name="arma_fogo_exame_imagem" label="Submetido a exame de imagem?" form={form} />

          {armaFogoExame && (
            <FormField
              control={form.control}
              name="arma_fogo_tipo_exame"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Exame</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Raio-X, Tomografia, Ultrassom" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <SimNaoField name="arma_fogo_cirurgia" label="Submetido a cirurgia?" form={form} />

          {form.watch('arma_fogo_cirurgia') && (
            <FormField
              control={form.control}
              name="arma_fogo_desc_cirurgia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Cirurgia</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o procedimento cirúrgico realizado..." rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <SimNaoField name="arma_fogo_projeteis_loc" label="Projétil(s) localizado(s) no corpo?" form={form} />

          {armaFogoProjeteis && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="arma_fogo_projeteis_qtd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Projéteis</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Switch
                  id="arma_fogo_projeteis_rec"
                  checked={form.watch('arma_fogo_projeteis_rec') ?? false}
                  onCheckedChange={(v) => form.setValue('arma_fogo_projeteis_rec', v as never)}
                />
                <Label htmlFor="arma_fogo_projeteis_rec" className="font-normal cursor-pointer">
                  Projétil(s) recuperado(s)?
                </Label>
              </div>

              {form.watch('arma_fogo_projeteis_rec') && (
                <FormField
                  control={form.control}
                  name="arma_fogo_projeteis_dest"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Destino dos Projéteis</FormLabel>
                      <FormControl>
                        <Input placeholder="Encaminhado a quem/onde?" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Finalização */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="cidade_preenchimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade de Preenchimento *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Manaus" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_preenchimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Preenchimento *</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? new Date().toISOString().slice(0, 10)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="outras_informacoes"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Outras Informações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações gerais, lesões encontradas, atendimentos realizados..."
                  rows={3}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
