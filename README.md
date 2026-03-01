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

## Configuração e Instalação

Siga os passos abaixo para preparar o ambiente e rodar o sistema localmente:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Wgomes156/sige-condo.git
   cd sige-condo
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase.
   ```bash
   cp .env.example .env
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O sistema estará disponível em `http://localhost:8080`.

## Controle de Versão (Git)

Para manter o seu sistema atualizado no GitHub, siga este fluxo de trabalho no terminal:

### 1. Salvar alterações localmente (Commit)
Sempre que fizer uma mudança importante, execute:
```bash
# Adiciona todos os arquivos modificados para o "palco" (stage)
git add .

# Salva as mudanças com uma mensagem descritiva
git commit -m "Descrição das melhorias realizadas"
```

### 2. Enviar para o GitHub (Push)
Para enviar os seus commits locais para o servidor remoto:
```bash
# Envia as alterações da branch principal (main) para o GitHub
git push origin main
```

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Verificação de código |
| `npm run test` | Testes unitários |

## Variáveis de ambiente

Consulte o arquivo [`.env.example`](.env.example) para ver as variáveis necessárias.

## Estrutura do Banco de Dados

As migrations do Supabase estão em `supabase/migrations/`. Para visualizar os dados localmente:

```bash
npx prisma studio
```
Ou utilize a extensão **SQLite Viewer** no VS Code para inspecionar arquivos `.db` se houver.
