# **PADRÃO DE NOMENCLATURA DE TABELAS**

## **Manual de Boas Práticas e Padronização (Database Naming Standard)**

---

## **1\. Objetivo do Padrão**

Este documento define um **padrão oficial para nomenclatura de tabelas em bancos de dados**, com foco em:

* Clareza imediata sobre **o que a tabela armazena**

* Identificação explícita de **domínio, tipo e finalidade**

* Agrupamento lógico e visual das tabelas

* Padronização entre equipes e projetos

* Facilidade de manutenção, evolução e integração

* Redução de ambiguidade e retrabalho

**Princípio fundamental:**  
 Se for possível entender a finalidade da tabela apenas lendo seu nome, o padrão está correto.

---

## **2\. Regras Globais de Nomenclatura (Obrigatórias)**

### **2.1 Estrutura Geral do Nome**

Todos os nomes de tabelas devem seguir o formato:

`<prefix>_<domain>[_<subdomain>]_<entity>[_<qualifier>]`

Exemplos:

* `master_person`

* `trx_sales_order`

* `trx_sales_order_item`

* `ref_sales_status`

* `rel_person_address`

* `aud_trx_sales_order`

---

### **2.2 Idioma e Estilo**

* **Idioma: Inglês (obrigatório)**

* **snake\_case** (letras minúsculas \+ underscore)

* Não utilizar acentos ou caracteres especiais

* Não utilizar abreviações não padronizadas

* Não utilizar plural de forma inconsistente

---

### **2.3 Singularidade**

**Todas as tabelas devem ser nomeadas no singular**

✔ `master_person`  
 ✘ `master_people`

✔ `trx_sales_order`  
 ✘ `trx_sales_orders`

A tabela representa um **tipo de entidade**, não um conjunto de registros.

---

## 

## 

## 

## 

## 

## 

## **3\. Prefixos Oficiais (Classificação das Tabelas)**

Os prefixos definem **o tipo e a finalidade da tabela** e são o principal mecanismo de organização do modelo de dados.

---

### **3.1 Tabelas de Negócio (Core Business)**

#### **`master_` – Dados Mestres (Entidades Principais)**

Representam entidades centrais do negócio e fonte primária de dados.

Exemplos:

* `master_sasi_event`  
* `master_person`  
* `master_product`  
* `master_company`  
* `master_warehouse`  
* `master_user`

Utilizar quando:

* A tabela representa uma entidade do mundo real  
* É amplamente referenciada por outras tabelas  
* Possui baixa volatilidade

---

#### **`trx_` – Transações / Eventos / Fatos**

Representam eventos de negócio ocorridos ao longo do tempo.

Exemplos:

* `trx_sales_order`  
* `trx_payment`  
* `trx_inventory_movement`  
* `trx_invoice`

Utilizar quando:

* O registro representa um evento  
* Existe carimbo de data/hora  
* O volume cresce continuamente

---

#### **`trx_<event>_item` – Itens de Transação**

Representam o detalhamento de uma transação.

Exemplos:

* `trx_sales_order_item`  
* `trx_invoice_item`

## **Regra: tabelas trx\_ devem usar inteiro longo (BIGINT) como id**

`Para tabelas de transação / eventos / fatos (trx_):`

`id BIGINT generated always as identity primary key`

---

## **Por que trx\_ NÃO deve usar UUID**

Tabelas trx\_ representam:

* `Eventos no tempo`

* `Alto volume`

* `Crescimento contínuo`

* `Consultas por data, ordenação, paginação`

* `Relatórios e BI`

### **UUID nessas tabelas causa:**

 `❌ Índices grandes`  
 `❌ Inserts mais lentos`  
 `❌ Pior locality de cache`  
 `❌ Paginação menos eficiente`  
 `❌ Overhead desnecessário`

---

## **Por que BIGINT é a melhor escolha para trx\_**

### Performance

* `Índices menores`

* `Inserção sequencial (append-only)`

* `Melhor ordenação natural`

* `Melhor para ORDER BY id DESC`

### Escalabilidade

* `BIGINT = 9.22 quintilhões de registros`

* `Na prática: infinito para eventos`

### BI / Analytics friendly

* `Muito mais eficiente para:`

  * `relatórios`

  * `agregações`

  * `ETL`

  * `data warehouse`

---

## **Padrão oficial para trx\_**

`create table trx_appointment (`

  `id BIGINT generated always as identity primary key,`

  `id_pet uuid not null,`

  `id_appointment_status integer not null,`

  `starts_at timestamptz not null,`

  `ends_at timestamptz,`

  `created_at timestamptz not null default now()`

`);`

`📌 Nunca:`

`id uuid primary key`

`📌 Sempre:`

`id bigint generated always as identity`

## 

---

### **3.2 Tabelas de Referência e Suporte ao Frontend**

#### **`ref_` – Tabelas de Referência (Lookup / Dropdown)**

Listas controladas utilizadas pela aplicação e pelo frontend.

Exemplos:

* `ref_sales_status`  
* `ref_person_type`  
* `ref_payment_method`  
* `ref_inventory_movement_type`

Utilização típica:

* Dropdowns  
* Status  
* Tipos  
* Categorias

Colunas recomendadas**:**

* `id`  
* `code`  
* `name`  
* `description`  
* `is_active`  
* `display_order`


Regra: tabelas ref\_ podem (e devem) usar INTEGER como id

**Para tabelas de referência (ref\_), o uso de INTEGER como chave primária é recomendado porque:**

São dados estáveis e controlados

* `Tipos`

* `Status`

* `Papéis`

* `Categorias`

* `Listas de dropdown`

Esses dados:

* `Mudam pouco`

* `São inseridos por admins`

* `Não crescem indefinidamente`

* `Não precisam de UUID para segurança`

---

**Benefícios práticos de usar INTEGER em ref\_**

Performance:

* `Índices menores`

* `JOINs mais rápidos`

* `Menor uso de memória`

Simplicidade:

* `FKs mais simples`

* `Melhor leitura de dados`

* `Facilita debug e relatórios`

Integração com frontend:

* `Valores pequenos e previsíveis`

* `Ideal para enums de UI (sem usar ENUM do banco)`

## **Padrão recomendado para tabelas ref\_**

`create table ref_pet_status (`

  `id            integer generated always as identity primary key,`

  `code          text not null unique,      -- ATIVO, INATIVO, FALECIDO`

  `name          text not null,             -- Ativo, Inativo, Falecido`

  `description   text,`

  `is_active     boolean not null default true,`

  `display_order integer);`

**Observações importantes:**

* `id → INTEGER`

* `code → usado pela aplicação`

* `name → exibido no frontend`

* `is_active → desativa sem apagar histórico`

---

### **3.3 Configurações e Regras**

#### **`cfg_` – Configurações do Sistema ou Negócio**

Controlam o comportamento da aplicação.

Exemplos:

* `cfg_system_parameter`  
* `cfg_sales_discount_rule`  
* `cfg_notification_template`

Utilizar quando:

* O dado não é transacional  
* Pode ser alterado por administradores  
* Define regras ou parâmetros

---

### **3.4 Tabelas de Relacionamento**

#### **`rel_` – Relacionamentos Muitos-para-Muitos**

Tabelas puramente associativas.

Exemplos:

* `rel_user_role`  
* `rel_product_supplier`  
* `rel_person_group`

Regras:

* Contêm apenas FKs e metadados  
* Não armazenam lógica de negócio

---

### **3.5 Segurança, Auditoria e Suporte Técnico**

#### **`sec_` – Segurança e Controle de Acesso**

Exemplos:

* `sec_user`  
* `sec_role`  
* `sec_permission`  
* `sec_user_role`

---

#### **`aud_` – Auditoria e Histórico de Alterações**

Exemplos:

* `aud_master_person`  
* `aud_trx_sales_order`

---

#### **`log_` – Logs Técnicos**

Exemplos:

* `log_api_request`  
* `log_job_execution`

---

### **3.6 Integração e Processamento de Dados**

#### **`stg_` – Staging (Dados Brutos)**

Exemplos:

* `stg_erp_person`  
* `stg_marketplace_order`

---

#### **`etl_` – Controle de ETL**

Exemplos:

* `etl_execution`  
* `etl_error`  
* `etl_queue`

---

## **4\. Domínios de Negócio (Business Domains)**

Os domínios indicam **o contexto funcional dos dados**.

Domínios comuns:

* `person`  
* `sales`  
* `inventory`  
* `product`  
* `financial`  
* `fiscal`  
* `user`  
* `security`  
* `integration`

Exemplos:

* `master_person_address`  
* `trx_inventory_movement`  
* `ref_sales_status`

---

## 

## **5\. Qualificadores e Sufixos Padronizados**

Utilizar apenas quando necessário e de forma consistente.

| Qualificador | Significado | Exemplo |
| ----- | ----- | ----- |
| `_item` | Item de transação | `trx_sales_order_item` |
| `_history` | Histórico (evitar, preferir `aud_`) | `master_person_history` |
| `_address` | Endereço | `master_person_address` |
| `_contact` | Contato | `master_person_contact` |
| `_document` | Documento | `master_person_document` |
| `_attachment` | Anexo | `trx_sales_order_attachment` |
| `_status` | Status (referência) | `ref_sales_status` |
| `_type` | Tipo (referência) | `ref_person_type` |
| `_category` | Categoria | `ref_product_category` |

---

## 

## 

## 

## 

## 

## **6\. Tabelas de Suporte ao Frontend (UI / Dropdowns)**

### **Regra principal:**

Se a tabela alimenta componentes de seleção no frontend, ela deve ser:

* `ref_` → lista global controlada

* `cfg_` → lista configurável por negócio, filial ou cliente

Exemplos:

* `ref_payment_method`

* `ref_order_status`

* `cfg_sales_reason`

---

## **7\. Origem dos Dados e Extensões/Relações** 

### **7.1 Extensões One-to-Many**

Manter o mesmo prefixo e domínio.

Exemplos:

* `master_person_address`

* `master_person_document`

* `master_product_price`

---

### **7.2 Relacionamentos Many-to-Many**

Sempre utilizar `rel_`.

Exemplos:

* `rel_person_group`

* `rel_sales_order_promotion`

---

### 

### **7.3 Referência em Transações**

Transações devem referenciar tabelas `master_` e `ref_`.

Exemplo:

* `trx_sales_order`

  * FK → `master_person`

  * FK → `ref_sales_status`

---

## **8\. Padrão de Chaves Primárias e Estrangeiras (Recomendado)**

### **Chave Primária (Quando se trata da coluna id, na master sempre será somente ID)**

Exemplos:

person

`id`

* 

---

### **Chave Estrangeira**

`id_<referenced_entity>`

person\_address

sales

* `id_person (referente a coluna ID da tabela PERSON)`  
* `id_sales_order`

Exemplos:

* `id_person`  
* `id_product`  
* `id_sales_status`

O nome da FK deve corresponder exatamente ao nome da entidade referenciada.

---

## **9\. Prefixo do Sistema (Opcional)**

Para ambientes com múltiplos sistemas:

`<system>_<prefix>_<domain>_<entity>`

Exemplos:

* `sasi_master_person`  
* `sasi_trx_sales_order`  
* `sasi_ref_sales_status`

---

## **10\. Anti-Padrões (Não Utilizar)**

❌ `data_table`  
 ❌ `general_info`  
 ❌ `misc`  
 ❌ `control`  
 ❌ `temp_data` (usar `stg_`)  
 ❌ `map_` (usar `rel_`)

---

## **11\. Checklist de Revisão (Code Review)**

Antes de aprovar um nome de tabela:

* Nome em inglês

* Prefixo correto

* Domínio correto

* Forma singular

* Finalidade clara

* Sem ambiguidade

* Compatível com o padrão existente

---

## **12\. Princípio**

**O schema do banco de dados é um contrato e uma forma de comunicação.**  
 Quanto mais claro o nome das tabelas, menor o custo de manutenção, integração e evolução do sistema.

---

## **13\. GLOSSÁRIO DE PREFIXOS**

**Regra:** nenhum prefixo fora desta lista deve ser criado sem aprovação de arquitetura.

### **Prefixos de Negócio**

| Prefixo | Significado | Quando Usar | Exemplo |
| ----- | ----- | ----- | ----- |
| `master_` | Dados mestres | Entidades centrais do negócio | `master_person` |
| `trx_` | Transação | Eventos de negócio | `trx_sales_order` |
| `rx_*_item` | Item de transação | Detalhamento | `trx_sales_order_item` |
| `ref_` | Referência | Dropdown, status, tipo | `ref_sales_status` |
| `cfg_` | Configuração | Parâmetros e regras | `cfg_sales_discount_rule` |
| `rel_` | Relacionamento | N:N | `rel_user_role` |

---

### 

### 

### 

### 

### **Prefixos Técnicos**

| Prefixo | Significado | Exemplo | obs |
| ----- | ----- | ----- | ----- |
| `sec_` | Segurança | `sec_user` |  |
| `aud_` | Auditoria | `aud_trx_sales_order`  | `ações do usuário` |
| `log_` | Log técnico | `log_api_request` | `ações do sistema` |
| `stg_` | Staging | `stg_erp_person` |  |
| `etl_` | ETL | `etl_execution` |  |

---

## **14\. GLOSSÁRIO DE DOMÍNIOS (BUSINESS DOMAINS)**

**Domínios representam “sobre o que” é o dado.**

| Domínio | Uso |
| ----- | ----- |
| `person` | Pessoas (clientes, fornecedores, usuários) |
| `sales` | Vendas, pedidos, orçamentos |
| `inventory` | Estoque e movimentações |
| `product` | Produtos, preços, categorias |
| `financial` | Financeiro e pagamentos |
| `fiscal` | Fiscal, impostos, notas |
| `user` | Usuários da aplicação |
| `security` | Segurança e permissões |
| `integration` | Integrações externas |

---

## **15\. QUALIFICADORES PERMITIDOS (SUFIXOS CONTROLADOS)**

**Evite inventar novos sufixos. Use apenas estes.**

| Qualificador | Uso |
| ----- | ----- |
| `_item` | Item de transação |
| `_address` | Endereço |
| `_contact` | Contato |
| `_document` | Documento |
| `_attachment` | Arquivo |
| `_status` | Status |
| `_type` | Tipo |
| `_category` | Categoria |
| `_history` | Histórico (preferir `aud_`) |

---

## **16\. MATRIZ DE DECISÃO – QUAL PREFIXO USAR?**

### **❓ Pergunta → ✔ Prefixo**

* É uma **entidade principal do negócio**? → `master_`

* É um **evento no tempo**? → `trx_`

* É **lista para dropdown**? → `ref_`

* É **regra/configuração**? → `cfg_`

* É **ligação N:N**? → `rel_`

* É **histórico/auditoria**? → `aud_`

* É **dado bruto de integração**? → `stg_`

* É **log técnico**? → `log_`

## **Regra consolidada de tipos de PK por prefixo**

| `Prefixo` | `Tipo de tabela` | `PK (id)` |
| ----- | ----- | ----- |
| `ref_` | `Referência / lookup` | `INTEGER` |
| `cfg_` | `Configuração` | `INTEGER ou UUID (caso específico)` |
| `master_` | `Entidade de negócio` | `UUID` |
| `trx_` | `Transação / evento` | `BIGINT` |
| `rel_` | `Relacionamento N:N` | `UUID` |
| `aud_` | `Auditoria` | `BIGINT` |
| `log_` | `Log técnico` | `BIGINT` |

`👉 Esse padrão é extremamente sólido e usado em ERPs, CRMs e sistemas financeiros de grande porte.`

---

## **17\. TEMPLATE OFICIAL DE DOCUMENTAÇÃO DE TABELA**

Use este modelo para documentar qualquer tabela.

`Table Name: trx_sales_order`

`Description:`

`Represents a sales order transaction created by a customer.`

`Table Type:`

`Transaction (trx_)`

`Domain:`

`sales`

`Primary Key:`

`id → sales`

`Foreign Keys:`

`- id_sales_status → ref_sales_status`

`Main Columns:`

`- order_date`

`- total_amount`

`- created_at`

`- updated_at`

`Used By:`

`- Backend API`

`- Frontend (Orders Screen)`

`- Reports`

`Notes:`

`Orders are immutable after status = COMPLETED.`

---

## **18\. PADRÃO DE COLUNAS (FORTEMENTE RECOMENDADO)**

### **Colunas técnicas padrão**

| Coluna | Uso |
| ----- | ----- |
| `created_at` | Data de criação |
| `updated_at` | Última atualização |
| `created_by` | Usuário criador |
| `updated_by` | Usuário editor |
| `is_active` | Controle lógico |

---

### **Padrão de chaves**

* **PK:** `id`

* **FK:** `id_<referenced_entity>`

✔ `id`

 ✔ `id_sales_status`

---

## **19\. EXEMPLOS COMPLETOS POR DOMÍNIO**

### **🧍 Pessoas**

* `master_person`

* `master_person_address`

* `master_person_contact`

* `master_person_document`

* `ref_person_type`

* `rel_person_group`

---

### **Estoque**

* `trx_inventory_movement`  
* `trx_inventory_movement_item`  
* `ref_inventory_movement_type`  
* `master_warehouse`  
* `master_product`

---

## **20\. CHECKLIST DE GOVERNANÇA (OBRIGATÓRIO EM PR)**

Antes de aprovar uma tabela:

* Nome em inglês  
* Prefixo correto  
* Domínio correto  
* Singular  
* Compatível com o glossário  
* FK seguem padrão  
* Sem abreviações livres  
* Finalidade clara

---

## **9\. ANTI-PADRÕES (PROIBIDOS)**

❌ `data`, `general`, `misc`, `control`  
 ❌ `table1`, `temp_table`  
 ❌ `map_` (use `rel_`)  
 ❌ `status_table` (use `ref_<domain>_status`)  
 ❌ plural inconsistente

---

## **PRINCÍPIO FINAL (REGRA DE OURO)**

**Um schema bem nomeado reduz bugs, acelera onboarding e diminui custo de manutenção.**  
 O nome da tabela é parte da arquitetura.

---

