# CondoPlus – Sistema Integrado de Gestão de Condomínios

Sistema completo para administradoras de condomínios, desenvolvido com React, TypeScript, Vite e Supabase.

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts
- **PDF**: jsPDF + jsPDF-AutoTable
- **Storage**: Supabase Storage para gestão de documentos e anexos

## Módulos do sistema

| Módulo | Descrição |
|--------|-----------|
| Dashboard | Visão geral de KPIs e indicadores |
| Condomínios | Cadastro e gestão de condomínios |
| Unidades | Gestão de unidades e moradores |
| Atendimentos | Central de atendimento com histórico detalhado e anexos |
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
| Usuários | Gestão de usuários com Controle de Acesso Baseado em Papel (RBAC) |
| Auditoria | Log de auditoria de ações |
| Configurações | Configurações do sistema |

## Níveis de Acesso (RBAC)

O sistema possui 5 níveis de acesso distintos:

- **Administrador**: Acesso total a todos os módulos e condomínios.
- **Síndico**: Acesso total aos condomínios que gerencia.
- **Gerente**: Acesso administrativo aos condomínios selecionados.
- **Operador**: Acesso operacional básico.
- **Morador**: Acesso restrito apenas à sua unidade e condomínio.

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

## Gestão de Atendimentos (Aprimorada)

O módulo de Atendimentos recebeu uma atualização significativa para suportar fluxos complexos de relacionamento com clientes:

- **Histórico Totalmente Editável**: Agora é possível corrigir, atualizar ou excluir registros de interações passadas, garantindo que o histórico reflita com precisão o que foi conversado.
- **Anexos em PDF por Interação**: Cada linha de histórico suporta agora o seu próprio documento PDF anexo. O sistema gerencia o upload para o Supabase Storage e a visualização via URLs assinadas e seguras.
- **Painel Lateral de Alta Estabilidade**: Migração para componentes de painel lateral (Sheets) com lógica de isolamento de estado, prevenindo conflitos visuais e garantindo que o sistema não "trave" ou apresente telas brancas durante a edição.
- **Ciclo de Vida de Documentos**: Ao excluir um registro de histórico, o sistema remove automaticamente os arquivos físicos do Storage, mantendo o armazenamento otimizado e organizado.
- **Interface Premium em Laranja**: Visual padronizado com o design system do CondoPlus, utilizando cores vibrantes e ícones claros para facilitar a navegação em desktop e mobile.

## Uso em Smartphones (PWA & Responsividade Total)

O SIGE-Condo foi totalmente refatorado para oferecer uma **experiência Mobile-First premium**. O sistema é um **Progressive Web App (PWA)**, permitindo instalação direta no smartphone com comportamento de aplicativo nativo.

### ✨ Diferenciais da Responsividade
- **Interface Inteligente**: Sidebar adaptativa que se torna um menu lateral (drawer) no mobile.
- **Visualização Otimizada**: Tabelas complexas transformam-se automaticamente em **Cards interativos** em telas pequenas.
- **Formulários Adaptativos**: Grids dinâmicos e diálogos em tela cheia para facilitar a digitação no celular.
- **Chat IA Mobile**: Assistente virtual com interface dedicada para mobile, otimizando o espaço de conversa.
- **Toque Amigável**: Alvos de clique expandidos (mínimo 44px) e suporte a gestos.

### Como instalar no celular

**Android (Chrome):**
1. Acesse a URL do sistema no navegador Chrome
2. O banner **"Instalar app"** aparece automaticamente, OU
3. Toque no menu (⋮) → **"Instalar app"**

**iPhone (Safari):**
1. Acesse a URL no navegador Safari
2. Toque no ícone de **Compartilhar** (seta para cima)
3. Selecione **"Adicionar à Tela de Início"**

### Atualizações automáticas

Quando você faz um novo deploy na Hostinger, o app no celular dos usuários **atualiza automaticamente** na próxima vez que for aberto — sem necessidade de reinstalar.

### Arquivos do PWA

| Arquivo | Descrição |
|---|---|
| `public/manifest.json` | Configuração do app (nome, cores, ícones, modo tela cheia) |
| `public/sw.js` | Service Worker — cache inteligente e atualizações automáticas |
| `public/icons/icon-192x192.png` | Ícone exibido na tela inicial do celular |
| `public/icons/icon-512x512.png` | Ícone para splash screen |

> [!NOTE]
> O sistema usa modo `standalone`, ou seja, ao abrir pelo ícone instalado, **não aparece a barra de endereço do navegador** — a experiência é idêntica a um app nativo.

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

---

## Problemas conhecidos e soluções (Deploy)

Registro dos problemas reais encontrados em produção e como foram resolvidos.

---

### Problema 1 — Tela branca ao clicar no lápis (editar atendimento)

**Sintoma:** Clicar no ícone de edição (lápis) na página de Atendimentos causava tela em branco.

**Causa:** Em `AtendimentoDetalhes.tsx`, a data do atendimento era formatada com `format(new Date(atendimento.data), ...)` diretamente, sem tratamento de erro. Se o campo `data` fosse vazio ou inválido, a função lançava um `RangeError: Invalid time value`, derrubando toda a árvore de componentes React.

**Solução:** Substituir a chamada direta por `safeFormatDate(atendimento.data)` — função auxiliar já existente no mesmo arquivo que trata datas inválidas com `try/catch`.

```tsx
// ANTES (quebrando)
value={format(new Date(atendimento.data), "dd/MM/yyyy", { locale: ptBR })}

// DEPOIS (correto)
value={safeFormatDate(atendimento.data)}
```

**Regra:** Nunca use `format(new Date(valor))` diretamente em dados vindos do banco. Sempre use `safeFormatDate` ou envolva em `try/catch`.

---

### Problema 2 — Site inteiro em branco após deploy (código de debug no HTML)

**Sintoma:** Após uma atualização no Hostinger, o site ficou completamente em branco — sem carregar nada.

**Causa:** O arquivo `index.html` continha um bloco de diagnóstico com `window.onerror` e `alert()` que foi incluído no build de produção pelo Vite:

```html
<script>
  window.onerror = function(msg, url, line) {
    alert("ERRO DE CARREGAMENTO: " + msg); // ← bloqueava a UI
  };
</script>
```

Qualquer erro JavaScript mínimo (mesmo inofensivo durante a inicialização) disparava um `alert()` que bloqueava o browser. Ao fechar o alerta, o React nunca havia montado → tela em branco. O mesmo bloco existia em `src/main.tsx` e foi removido de lá também.

**Solução:** Remover completamente qualquer `alert()` do `window.onerror` do `index.html` e do `main.tsx`. Use `console.error` para diagnóstico.

**Regra:** Jamais deixe `alert()` em código que vai para produção. O `index.html` é processado pelo Vite e seu conteúdo vai integralmente para o build.

---

### Problema 3 — ZIP criado no Windows com barras invertidas quebra estrutura de pastas no Linux

**Sintoma:** Após subir o site no Hostinger, a página ficava em loop de "Carregando..." indefinidamente. O JavaScript nunca carregava.

**Causa:** O ZIP foi criado com PowerShell (`Compress-Archive`) no Windows. O Windows usa barra invertida (`\`) como separador de caminho. O PowerShell embutia os caminhos com `\` dentro do ZIP:

```
assets\index-BwULJ2Lw.js    ← barra invertida (Windows)
assets\index-C16B8aMO.css
icons\icon-192x192.png
```

O Linux (servidor Hostinger) interpreta `\` como parte do nome do arquivo, não como separador de diretório. Então os arquivos eram extraídos assim:

```
public_html/
├── assets\index-BwULJ2Lw.js    ← arquivo com backslash no nome!
├── assets\index-C16B8aMO.css   ← arquivo com backslash no nome!
└── index.html                   ← referencia /assets/index-BwULJ2Lw.js → 404!
```

A pasta `assets/` nunca era criada. O `index.html` referenciava `/assets/index-BwULJ2Lw.js` (404) e o site ficava travado no spinner.

**Solução:** Criar o ZIP usando o pacote `archiver` do Node.js, que gera sempre caminhos com barra normal (`/`):

```bash
npm install archiver --save-dev
node create-zip.cjs   # script na raiz do projeto
```

O arquivo `create-zip.cjs` na raiz do projeto cria o ZIP corretamente:

```js
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const output = fs.createWriteStream(path.join(__dirname, 'dist.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });
output.on('close', () => console.log('ZIP criado: ' + archive.pointer() + ' bytes'));
archive.on('error', (err) => { throw err; });
archive.pipe(output);
archive.directory(path.join(__dirname, 'dist'), false);
archive.finalize();
```

**Regra:** **Nunca use `Compress-Archive` do PowerShell** para criar ZIPs destinados a servidores Linux. Use sempre `node create-zip.cjs` ou o comando `zip` (se disponível no terminal).

---

### Problema 4 — Service Worker antigo servindo conteúdo em cache após novo deploy

**Sintoma:** Mesmo após subir arquivos novos no Hostinger, alguns usuários continuavam vendo a versão antiga ou com comportamento incorreto.

**Causa:** O Service Worker (`sw.js`) com `CACHE_VERSION = 'condoplus-v2'` permanecia ativo no browser dos usuários, servindo arquivos JavaScript e CSS em cache da versão anterior.

**Solução:** Incrementar o `CACHE_VERSION` no `public/sw.js` a cada deploy que altere arquivos de assets:

```js
// public/sw.js
const CACHE_VERSION = 'condoplus-v3'; // ← incrementar a cada deploy
```

O Service Worker detecta a mudança de versão, ativa o novo worker, limpa os caches antigos e recarrega os clientes automaticamente.

**Regra:** Sempre que fizer um deploy, incremente o `CACHE_VERSION` no `public/sw.js` para garantir que todos os usuários recebam a versão nova.

---

### Problema 5 — Erro "removeChild" ao sair da página de Atendimentos

**Sintoma:** Ao navegar para outra página a partir de Atendimentos, aparecia a mensagem de erro:
> *"Ops! Algo deu errado. Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node"*

**Causa:** O componente `Atendimentos.tsx` usava `setTimeout` (300 ms e 400 ms) para coordenar a abertura e o fechamento dos painéis laterais (`Sheet` do Radix UI). Quando o usuário navegava para outra página enquanto um timeout ainda estava pendente, o React Router desmontava a página e removia os nós do DOM. Ao disparar, o timeout tentava atualizar o estado de um componente já desmontado, forçando o Radix UI a tentar remover nós de portals de um DOM que já havia sido limpo → erro `removeChild`.

**Solução:** Em `Atendimentos.tsx`:
1. Criado `timeoutsRef` para rastrear todos os `setTimeout` abertos.
2. Adicionado `useEffect` com cleanup que, ao desmontar, cancela todos os timeouts **e força o fechamento imediato de todos os Sheets** — dando ao Radix UI a chance de limpar seus portals enquanto o DOM ainda está íntegro.

```tsx
const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

useEffect(() => {
  return () => {
    timeoutsRef.current.forEach(clearTimeout);
    setIsFormOpen(false);
    setIsAssistenteOpen(false);
    setIsDetalhesOpen(false);
    setIsEditOpen(false);
  };
}, []);
```

**Regra:** Qualquer componente que use `setTimeout` para controlar animações de portals (Sheet, Dialog, Popover) deve limpar os timeouts e fechar os portals no `useEffect` cleanup, para evitar conflitos de DOM ao trocar de rota.

---

### Checklist de deploy seguro para Hostinger

Antes de cada atualização, confirme:

- [ ] Sem `alert()` em `index.html` ou `main.tsx`
- [ ] Sem código de debug (`console.log` excessivos, textos como "CONEXÃO ATIVA ✅") em componentes
- [ ] `CACHE_VERSION` incrementado em `public/sw.js`
- [ ] ZIP criado com `node create-zip.cjs` (não com PowerShell)
- [ ] Todos os arquivos antigos deletados do `public_html` antes de extrair o novo ZIP
- [ ] Após extrair, verificar que `assets/` é uma **pasta** (não arquivos com `\` no nome)
- [ ] Testar em aba anônima após o deploy
