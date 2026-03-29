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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Props {
  form: UseFormReturn<EncaminhamentoFormData>
}

export function Step03Identificacao({ form }: Props) {
  const identificado = form.watch('identificado')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Identificação do Corpo</h2>
        <p className="text-sm text-muted-foreground">
          Dados de identificação do falecido.
        </p>
      </div>

      {/* Toggle identificado */}
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        <Switch
          id="identificado"
          checked={identificado ?? true}
          onCheckedChange={(v) => form.setValue('identificado', v as never)}
        />
        <div>
          <Label htmlFor="identificado" className="font-medium cursor-pointer">
            Corpo identificado
          </Label>
          <p className="text-xs text-muted-foreground">
            {identificado
              ? 'Preencha os dados de identificação abaixo'
              : 'Descreva as características físicas para corpos não identificados'}
          </p>
        </div>
      </div>

      {!identificado && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="caracteristicas_fisicas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Características Físicas *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Sexo aparente, altura estimada, peso estimado, cor da pele, cabelo, marcas especiais..."
                    rows={4}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vestimentas_objetos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vestimentas e Objetos Encontrados</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva as vestimentas e objetos encontrados com o corpo..."
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
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="sexo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sexo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? 'indeterminado'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="indeterminado">Indeterminado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {identificado && (
          <>
            <FormField
              control={form.control}
              name="nome_falecido"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do falecido" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_nascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="Somente números (11 dígitos)" maxLength={11} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do RG" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissão</FormLabel>
                  <FormControl>
                    <Input placeholder="Profissão do falecido" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="naturalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naturalidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade/Estado de nascimento" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filiacao_mae"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Mãe</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filiacao_pai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Pai</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_vitima"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Logradouro, número, bairro, cidade" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sm:col-span-2 space-y-1">
              <p className="text-sm font-medium">Contato Familiar</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="contato_familiar_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do familiar" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato_familiar_parentesco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Parentesco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cônjuge, Filho(a)" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato_familiar_telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(92) 9 9999-9999" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
