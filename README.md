# SIGE Condo – Sistema Integrado de Gestão de Condomínios

Sistema completo para administradoras de condomínios, desenvolvido com React, TypeScript, Vite e Supabase.

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts
- **PDF**: jsPDF + jsPDF-AutoTable

## Módulos do sistema

| Módulo | Descrição |
|--------|-----------|
| Dashboard | Visão geral de KPIs e indicadores |
| Condomínios | Cadastro e gestão de condomínios |
| Unidades | Gestão de unidades e moradores |
| Atendimentos | Central de atendimento |
| Financeiro | Controle financeiro e lançamentos |
| Boletos | Geração e gestão de boletos |
| Boletos Recorrentes | Cobrança recorrente automatizada |
| Contas Bancárias | Gestão de contas bancárias |
| Ordens de Serviço | Controle de manutenções |
| Ocorrências | Registro de ocorrências de condomínio |
| Demandas | Gestão de demandas internas |
| Serviços | Cadastro de serviços |
| Propostas | Gestão de propostas comerciais |
| Acordos | Controle de acordos de inadimplência |
| Reservas | Reserva de áreas comuns |
| Relatórios | Relatórios gerenciais e de inadimplência |
| Comunicados | Envio de comunicados aos moradores |
| Portal do Morador | Acesso simplificado para moradores |
| Usuários | Gestão de usuários e permissões |
| Auditoria | Log de auditoria de ações |
| Configurações | Configurações do sistema |

## Pré-requisitos

- Node.js 18+ e npm
- Conta no [Supabase](https://supabase.com)

## Configuração

```sh
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd sige-condo

# 2. Copie e configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O browser abrirá automaticamente em `http://localhost:8080`.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Verificação de código |
| `npm run test` | Testes unitários |

## Variáveis de ambiente

Consulte o arquivo [`.env.example`](.env.example) para ver as variáveis necessárias.

## Banco de dados

As migrations do Supabase estão em `supabase/migrations/`. Para visualizar o banco localmente use:

```sh
npx prisma studio
```

Ou instale a extensão **SQLite Viewer** no VS Code.
