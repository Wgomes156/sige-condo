import jsPDF from 'jspdf';

export const exportEscopoToPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;

  const addTitle = (text: string, size: number = 16) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += size * 0.5 + 4;
  };

  const addSubtitle = (text: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 8;
  };

  const addParagraph = (text: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  const addBullet = (text: string, indent: number = 0) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const bulletX = margin + indent;
    const lines = doc.splitTextToSize(text, contentWidth - indent - 5);
    doc.text('•', bulletX, y);
    doc.text(lines, bulletX + 5, y);
    y += lines.length * 5 + 2;
  };

  const addSpace = (space: number = 6) => { y += space; };

  // Header
  addTitle('CONDOPLUS', 20);
  addTitle('Sistema de Gestão de Condomínios', 14);
  addSpace(4);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, y);
  y += 12;

  // 1. Visão Geral
  addTitle('1. VISÃO GERAL');
  addParagraph('Sistema web completo para gestão de administradoras de condomínios, oferecendo controle centralizado de atendimentos, finanças, cobranças, ordens de serviço e relatórios gerenciais.');
  addSpace();

  // 2. Módulos
  addTitle('2. MÓDULOS DO SISTEMA');

  addSubtitle('2.1 Dashboard');
  addBullet('Painel de indicadores com métricas em tempo real');
  addBullet('Visualização de atendimentos do dia, pendências e alertas');
  addBullet('Gráficos de performance e tendências');
  addSpace();

  addSubtitle('2.2 Atendimentos');
  addBullet('Registro completo de atendimentos por canal (telefone, e-mail, WhatsApp, presencial)');
  addBullet('Categorização por motivo de contato');
  addBullet('Histórico de alterações com auditoria automática');
  addBullet('Filtros avançados e busca textual');
  addBullet('Exportação para CSV e PDF');
  addSpace();

  addSubtitle('2.3 Condomínios');
  addBullet('Cadastro completo de condomínios com dados do síndico');
  addBullet('Gestão de unidades e moradores');
  addBullet('Vinculação com administradora');
  addBullet('Informações de infraestrutura (porteiro, monitoramento, segurança)');
  addSpace();

  addSubtitle('2.4 Financeiro');
  addBullet('Contas a pagar e receber por condomínio');
  addBullet('Categorias financeiras personalizáveis');
  addBullet('Dashboard com saldo, inadimplência e fluxo de caixa');
  addBullet('Gráficos de distribuição por categoria');
  addSpace();

  addSubtitle('2.5 Boletos');
  addBullet('Gestão manual e automática de boletos');
  addBullet('Importação em massa via CSV');
  addBullet('Envio de e-mails de cobrança (individual e em massa)');
  addBullet('Visualização prévia (preview) antes do envio');
  addBullet('Controle de status: Pendente, Pago, Vencido, Cancelado');
  addSpace();

  addSubtitle('2.6 Boletos Recorrentes');
  addBullet('Configuração de cobrança mensal por condomínio');
  addBullet('Geração automática no primeiro dia de cada mês');
  addBullet('Histórico de gerações com status e valores');
  addSpace();

  addSubtitle('2.7 Ordens de Serviço');
  addBullet('Registro de OS para manutenção e reparos');
  addBullet('Prioridades: Urgente, Periódico, Não Urgente');
  addBullet('Status: Aberta, Em Andamento, Concluída, Cancelada');
  addBullet('Dashboard com gráficos de status e prioridade');
  addBullet('Impressão de detalhes da OS');
  addSpace();

  addSubtitle('2.8 Relatórios');
  addBullet('Relatório de Atendimentos com performance por operador');
  addBullet('Relatório de Inadimplência por condomínio e faixa de atraso');
  addBullet('Exportação completa em CSV e PDF');
  addSpace();

  addSubtitle('2.9 Configurações');
  addBullet('Gestão de categorias financeiras');
  addBullet('Configurações do sistema');
  addBullet('Exportação do escopo do projeto');
  addSpace();

  // 3. Autenticação
  doc.addPage();
  y = 20;
  addTitle('3. AUTENTICAÇÃO E SEGURANÇA');
  addBullet('Autenticação via e-mail/senha');
  addBullet('Perfis de acesso: Administrador e Operador');
  addBullet('Rotas protegidas com verificação de sessão');
  addBullet('Row Level Security (RLS) em todas as tabelas');
  addBullet('Auditoria automática de alterações');
  addSpace();

  // 4. Automações
  addTitle('4. AUTOMAÇÕES');
  addBullet('Cron Job: Geração mensal de boletos recorrentes (dia 1, 08:00)');
  addBullet('Edge Function: Envio de e-mails de cobrança via Resend');
  addBullet('Edge Function: Geração em lote de boletos');
  addBullet('Trigger: Atualização automática de status de boletos vencidos');
  addBullet('Trigger: Registro de histórico de alterações');
  addSpace();

  // 5. Integrações
  addTitle('5. INTEGRAÇÕES');
  addBullet('Resend: Envio de e-mails de cobrança e notificações');
  addBullet('Supabase Realtime: Notificações em tempo real');
  addSpace();

  // 6. Tecnologias
  addTitle('6. STACK TECNOLÓGICA');
  addSubtitle('Frontend');
  addBullet('React 18 com TypeScript');
  addBullet('Vite (build tool)');
  addBullet('Tailwind CSS + shadcn/ui');
  addBullet('React Query (TanStack)');
  addBullet('React Router DOM');
  addBullet('Recharts (gráficos)');
  addBullet('jsPDF (exportação PDF)');
  addSpace();

  addSubtitle('Backend (Lovable Cloud)');
  addBullet('PostgreSQL (banco de dados)');
  addBullet('Edge Functions (Deno)');
  addBullet('Row Level Security');
  addBullet('Realtime Subscriptions');
  addSpace();

  // 7. Banco de Dados
  doc.addPage();
  y = 20;
  addTitle('7. ESTRUTURA DO BANCO DE DADOS');

  const tables = [
    { name: 'profiles', desc: 'Perfis de usuários do sistema' },
    { name: 'user_roles', desc: 'Papéis de acesso (admin/operador)' },
    { name: 'administradoras', desc: 'Cadastro de administradoras' },
    { name: 'condominios', desc: 'Cadastro de condomínios' },
    { name: 'unidades', desc: 'Unidades e moradores por condomínio' },
    { name: 'atendimentos', desc: 'Registro de atendimentos' },
    { name: 'ordens_servico', desc: 'Ordens de serviço' },
    { name: 'boletos', desc: 'Boletos de cobrança' },
    { name: 'transacoes_financeiras', desc: 'Transações financeiras' },
    { name: 'categorias_financeiras', desc: 'Categorias de receitas/despesas' },
    { name: 'configuracoes_cobranca', desc: 'Configurações de cobrança recorrente' },
    { name: 'historico_geracao_boletos', desc: 'Histórico de geração automática' },
  ];

  tables.forEach(table => {
    addBullet(`${table.name}: ${table.desc}`);
  });
  addSpace();

  // 8. Documentação Técnica - APIs e Endpoints
  doc.addPage();
  y = 20;
  addTitle('8. DOCUMENTAÇÃO TÉCNICA');
  addParagraph('O sistema utiliza uma arquitetura baseada em APIs RESTful com Edge Functions para operações customizadas e acesso direto ao banco de dados via PostgREST.');
  addSpace();

  addSubtitle('8.1 Base URLs');
  addBullet('API REST (PostgREST): https://[PROJECT_ID].supabase.co/rest/v1/');
  addBullet('Edge Functions: https://[PROJECT_ID].supabase.co/functions/v1/');
  addBullet('Autenticação: https://[PROJECT_ID].supabase.co/auth/v1/');
  addSpace();

  addSubtitle('8.2 Autenticação da API');
  addBullet('Todas as requisições devem incluir o header "apikey" com a chave anônima');
  addBullet('Para operações autenticadas, incluir "Authorization: Bearer [JWT_TOKEN]"');
  addBullet('Tokens JWT são obtidos via endpoints de login/signup');
  addSpace();

  addSubtitle('8.3 Edge Functions (Backend Customizado)');
  addSpace(2);

  // Endpoint 1
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text('POST /functions/v1/enviar-email-cobranca', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addParagraph('Envia e-mails de cobrança para moradores baseado nos boletos cadastrados.');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text('Request Body (JSON):', margin + 5, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  addBullet('boleto_id (string, opcional): ID de um boleto específico', 5);
  addBullet('boleto_ids (array, opcional): Lista de IDs de boletos para envio em massa', 5);
  addBullet('tipo (string, opcional): "cobranca" | "lembrete" | "inadimplencia" (default: "cobranca")', 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text('Response (JSON):', margin + 5, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  addBullet('success (boolean): Indica se a operação foi bem sucedida', 5);
  addBullet('message (string): Mensagem descritiva do resultado', 5);
  addBullet('enviados (number): Quantidade de e-mails enviados com sucesso', 5);
  addBullet('erros (number): Quantidade de falhas no envio', 5);
  addBullet('resultados (array): Detalhes de cada boleto processado', 5);
  addSpace();

  // Endpoint 2
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text('POST /functions/v1/gerar-boletos-recorrentes', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addParagraph('Gera boletos automaticamente para todas as unidades ativas de condomínios com cobrança configurada.');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text('Request Body (JSON - todos opcionais):', margin + 5, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  addBullet('condominio_id (string): Filtrar por condomínio específico', 5);
  addBullet('referencia (string): Definir mês/ano de referência manualmente', 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text('Response (JSON):', margin + 5, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  addBullet('success (boolean): Indica se a operação foi bem sucedida', 5);
  addBullet('message (string): Mensagem descritiva do resultado', 5);
  addBullet('boletos_gerados (number): Total de boletos criados', 5);
  addBullet('resultados (array): Detalhes por condomínio processado', 5);
  addSpace();

  addSubtitle('8.4 API REST - Principais Endpoints');
  addParagraph('Os endpoints abaixo seguem o padrão REST com suporte a filtros, ordenação e paginação via query parameters.');
  addSpace(2);

  const restEndpoints = [
    { method: 'GET/POST', path: '/rest/v1/condominios', desc: 'Listar/Criar condomínios' },
    { method: 'GET/POST', path: '/rest/v1/atendimentos', desc: 'Listar/Criar atendimentos' },
    { method: 'GET/POST', path: '/rest/v1/boletos', desc: 'Listar/Criar boletos' },
    { method: 'GET/POST', path: '/rest/v1/transacoes_financeiras', desc: 'Listar/Criar transações' },
    { method: 'GET/POST', path: '/rest/v1/ordens_servico', desc: 'Listar/Criar ordens de serviço' },
    { method: 'GET/POST', path: '/rest/v1/unidades', desc: 'Listar/Criar unidades' },
    { method: 'GET/POST', path: '/rest/v1/categorias_financeiras', desc: 'Listar/Criar categorias' },
    { method: 'GET/POST', path: '/rest/v1/configuracoes_cobranca', desc: 'Configurações de cobrança' },
    { method: 'PATCH', path: '/rest/v1/[tabela]?id=eq.[uuid]', desc: 'Atualizar registro específico' },
    { method: 'DELETE', path: '/rest/v1/[tabela]?id=eq.[uuid]', desc: 'Excluir registro específico' },
  ];

  restEndpoints.forEach(endpoint => {
    addBullet(`${endpoint.method} ${endpoint.path} - ${endpoint.desc}`);
  });
  addSpace();

  addSubtitle('8.5 Filtros e Query Parameters');
  addBullet('eq.[valor]: Igual a (ex: ?status=eq.pendente)');
  addBullet('neq.[valor]: Diferente de');
  addBullet('gt.[valor] / gte.[valor]: Maior que / Maior ou igual');
  addBullet('lt.[valor] / lte.[valor]: Menor que / Menor ou igual');
  addBullet('like.[padrão]: Busca textual (ex: ?nome=like.*silva*)');
  addBullet('ilike.[padrão]: Busca textual case-insensitive');
  addBullet('in.([valores]): Valor está na lista (ex: ?status=in.(pendente,pago))');
  addBullet('order=[coluna].asc|desc: Ordenação');
  addBullet('limit=[n]: Limitar quantidade de resultados');
  addBullet('offset=[n]: Paginação');
  addSpace();

  addSubtitle('8.6 Códigos de Resposta HTTP');
  addBullet('200 OK: Requisição bem sucedida');
  addBullet('201 Created: Registro criado com sucesso');
  addBullet('204 No Content: Exclusão bem sucedida');
  addBullet('400 Bad Request: Erro nos parâmetros da requisição');
  addBullet('401 Unauthorized: Token de autenticação inválido ou ausente');
  addBullet('403 Forbidden: Sem permissão (RLS policy)');
  addBullet('404 Not Found: Recurso não encontrado');
  addBullet('500 Internal Server Error: Erro no servidor');
  addSpace();

  // 9. Funcionalidades de Exportação
  doc.addPage();
  y = 20;
  addTitle('9. FUNCIONALIDADES DE EXPORTAÇÃO');
  addBullet('CSV: Atendimentos, inadimplentes, ordens de serviço, boletos');
  addBullet('PDF: Relatórios completos com gráficos e resumos');
  addBullet('Impressão: Detalhes de OS e boletos');
  addBullet('E-mail: Envio de boletos em PDF anexo');
  addSpace();

  // Footer
  addSpace(10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Este documento foi gerado automaticamente pelo sistema.', margin, y);

  // Save
  doc.save(`escopo-sistema-${new Date().toISOString().split('T')[0]}.pdf`);
};
