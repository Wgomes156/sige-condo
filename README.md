# CondoPlus – Sistema Integrado de Gestão de Condomínios

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

## Hospedagem (Hostinger)

O sistema está configurado para ser hospedado na Hostinger como um site estático.

### Configuração de Caminhos para Hostinger

O sistema usa `base: '/'` no `vite.config.ts`, que é a configuração correta para quando o sistema está hospedado em um domínio principal (ex: `https://condoplus.solutions`).

Isso evita que telas fiquem em branco (Blank Page) ao acessar URLs de subpáginas como `/boletos/recorrentes` e recarregar a página, pois os caminhos dos arquivos CSS/JS sempre buscarão a partir da raiz do domínio.

 **Se você for hospedar em um subdiretório** (ex: `https://meusite.com/condoplus/`), você precisará alterar o `base` no `vite.config.ts` para `/condoplus/` antes de rodar o build.

### Passos para a Hospedagem:

1.  **Gere o build**: No terminal, rode `npm run build`. Isso criará a pasta `dist/`.
2.  **Verifique o index.html**: Abra `dist/index.html` e confirme se os caminhos começam com `./assets/` (ex: `src="./assets/index-xxx.js"`).
3.  **Compacte os arquivos**: Entre na pasta `dist/`, selecione **todos** os arquivos lá dentro e crie um arquivo ZIP (ex: `site.zip`).
    *   *Importante: O arquivo `index.html` deve estar na raiz do ZIP, não dentro de uma subpasta.*
4.  **Upload**: No Gerenciador de Arquivos da Hostinger, envie o ZIP para a pasta `public_html` e extraia.

### Como atualizar o sistema:

Sempre que fizer mudanças no código, repita o processo:
1.  Rode `npm run build`.
2.  Zipe o conteúdo de `dist/`.
3.  Na Hostinger, apague os arquivos antigos da `public_html` e envie/extraia o novo ZIP.

> [!NOTE]
> O arquivo `.htaccess` (necessário para o roteamento do React) já está na pasta `public/` do projeto e será incluído automaticamente em todos os seus builds.

## Segurança e Persistência de Dados

É importante entender a separação entre os arquivos do site e os seus dados:

-   **Hostinger (Frontend)**: Hospeda apenas a "interface" do sistema (código visual).
-   **Supabase (Backend/Banco de Dados)**: Guarda todos os registros (moradores, condomínios, atendimentos).

**Os seus dados estão seguros durante as atualizações:**
1.  Quando você faz um novo upload na Hostinger, você está apenas trocando a "aparência" do sistema.
2.  O banco de dados no Supabase é independente e **não é apagado** nas atualizações do site.
3.  Mesmo que a Hostinger fique fora do ar, os seus dados continuam intactos na infraestrutura do Supabase.

## Variáveis de ambiente

Consulte o arquivo [`.env.example`](.env.example) para ver as variáveis necessárias. No Supabase, certifique-se de configurar o **Site URL** para o seu domínio (ex: `https://condoplus.solutions`).
