/**
 * CondoPlus — Backup via API Supabase -> PostgreSQL local
 * Cria schema automaticamente a partir dos dados reais
 * Uso: node backup-api-condoplus.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// ── CONFIGURACOES ──────────────────────────────────────────────────────────────
const SUPA_URL  = 'https://efmfyuewgtejsmwiusgn.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWZ5dWV3Z3RlanNtd2l1c2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkxNDI1NSwiZXhwIjoyMDk2NDkwMjU1fQ.0h8c6ZnhHYApmfGUAkao-Jvh5ffThOcX-rbUvqGMUwY';

const LOCAL_USER = 'postgres';
const LOCAL_PASS = 'Psc561';
const LOCAL_DB   = 'condoplus_backup';
const LOCAL_PORT = '5432';
const PG_BIN     = 'C:\\Program Files\\PostgreSQL\\18\\bin';
const BACKUP_DIR = 'D:\\sige-condo\\backups';

// Todas as tabelas que existem no Supabase
const TABELAS = [
  'profiles', 'user_roles', 'condominios', 'unidades',
  'atendimentos', 'audit_logs', 'fornecedores', 'reservas',
  'areas_comuns', 'comunicados', 'boletos', 'historico_geracao_boletos',
  'ocorrencias_condominio', 'anexos', 'administradoras',
  'ordens_servico', 'transacoes_financeiras', 'categorias_financeiras',
  'configuracoes_cobranca', 'contas_bancarias',
  'proprietarios_unidade', 'inquilinos_unidade', 'moradores_unidade',
  'veiculos_unidade', 'acessos_unidade', 'visitantes_autorizados',
  'animais_unidade', 'vagas_garagem', 'ocorrencias_unidade',
  'documentos_unidade', 'user_condominio_access', 'user_unidade_access',
  'mensagens', 'conversas', 'participantes_conversa',
];
// ── FIM DAS CONFIGURACOES ──────────────────────────────────────────────────────

const supabase = createClient(SUPA_URL, SUPA_KEY);

function log(msg) {
  const ts = new Date().toISOString().replace('T',' ').slice(0,19);
  console.log(`${ts} | ${msg}`);
}

const UUID_RE   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE   = /^\d{4}-\d{2}-\d{2}(T|\s)/;
const DATE2_RE  = /^\d{4}-\d{2}-\d{2}$/;

function inferType(col, samples) {
  const vals = samples.map(r => r[col]).filter(v => v !== null && v !== undefined);
  if (vals.length === 0) return 'TEXT';
  const v = vals[0];
  if (typeof v === 'boolean') return 'BOOLEAN';
  if (typeof v === 'number') return Number.isInteger(v) ? 'BIGINT' : 'NUMERIC';
  if (typeof v === 'object') return 'JSONB';
  if (typeof v === 'string') {
    if (UUID_RE.test(v)) return 'UUID';
    if (DATE_RE.test(v)) return 'TIMESTAMPTZ';
    if (DATE2_RE.test(v)) return 'DATE';
  }
  return 'TEXT';
}

function escape(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/\\/g,'\\\\').replace(/'/g,"''")}'::jsonb`;
  const s = String(v).replace(/\\/g,'\\\\').replace(/'/g,"''");
  return `'${s}'`;
}

async function main() {
  log('=== Backup CondoPlus via API ===');
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  const ts   = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  const file = `${BACKUP_DIR}\\condoplus_${ts}.sql`;

  const env = { ...process.env, PGPASSWORD: LOCAL_PASS };

  // Encerrar conexoes ativas e recriar banco
  log(`Recriando banco '${LOCAL_DB}'...`);
  execSync(
    `"${PG_BIN}\\psql.exe" -h localhost -p ${LOCAL_PORT} -U ${LOCAL_USER} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${LOCAL_DB}';" postgres`,
    { env, shell: true, stdio: 'pipe' }
  );
  execSync(
    `"${PG_BIN}\\psql.exe" -h localhost -p ${LOCAL_PORT} -U ${LOCAL_USER} -c "DROP DATABASE IF EXISTS \\"${LOCAL_DB}\\";" postgres`,
    { env, shell: true, stdio: 'pipe' }
  );
  execSync(
    `"${PG_BIN}\\psql.exe" -h localhost -p ${LOCAL_PORT} -U ${LOCAL_USER} -c "CREATE DATABASE \\"${LOCAL_DB}\\" ENCODING 'UTF8' TEMPLATE template0;" postgres`,
    { env, shell: true, stdio: 'pipe' }
  );

  let schemaSql = `-- CondoPlus backup ${new Date().toISOString()}\n`;
  schemaSql += `SET client_encoding = 'UTF8';\n`;
  schemaSql += `SET standard_conforming_strings = on;\n\n`;

  let dataSql = '';
  let totalRows = 0;
  const tableData = {};

  // Buscar dados de cada tabela
  for (const tabela of TABELAS) {
    const { data, error } = await supabase.from(tabela).select('*').limit(50000);
    if (error || !data || data.length === 0) {
      if (error && !error.message?.includes('does not exist') && !error.message?.includes('schema cache')) {
        log(`  ${tabela}: AVISO - ${error.message}`);
      } else if (!error) {
        log(`  ${tabela}: vazia.`);
      } else {
        log(`  ${tabela}: nao existe.`);
      }
      continue;
    }
    tableData[tabela] = data;
    log(`  ${tabela}: ${data.length} registros.`);
    totalRows += data.length;
  }

  // Gerar schema CREATE TABLE a partir dos dados
  log('Gerando schema...');
  for (const [tabela, rows] of Object.entries(tableData)) {
    const cols = Object.keys(rows[0]);
    const colDefs = cols.map(col => {
      const tipo = inferType(col, rows);
      const pk   = col === 'id' ? ' PRIMARY KEY' : '';
      return `  "${col}" ${tipo}${pk}`;
    }).join(',\n');
    schemaSql += `CREATE TABLE IF NOT EXISTS "${tabela}" (\n${colDefs}\n);\n\n`;
  }

  // Gerar INSERTs
  log('Gerando dados...');
  for (const [tabela, rows] of Object.entries(tableData)) {
    const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');
    dataSql += `-- ${tabela}\n`;
    for (const row of rows) {
      const vals = Object.values(row).map(escape).join(', ');
      dataSql += `INSERT INTO "${tabela}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
    }
    dataSql += '\n';
  }

  const fullSql = schemaSql + dataSql;
  writeFileSync(file, fullSql, { encoding: 'utf8' });
  log(`SQL gerado: ${file} (${Math.round(fullSql.length/1024)} KB)`);

  // Importar no PostgreSQL local
  log(`Importando em '${LOCAL_DB}'...`);
  execSync(
    `"${PG_BIN}\\psql.exe" -h localhost -p ${LOCAL_PORT} -U ${LOCAL_USER} -d ${LOCAL_DB} -f "${file}" -q`,
    { env, shell: true, stdio: 'inherit' }
  );

  log(`=== Concluido: ${totalRows} registros em '${LOCAL_DB}' ===`);
}

main().catch(e => { log(`ERRO: ${e.message}`); process.exit(1); });
