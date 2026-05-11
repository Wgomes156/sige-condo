const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '../README.md');
const outputPath = path.join(__dirname, '../src/lib/versionData.ts');

try {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const match = readmeContent.match(/\*\*Última atualização:\*\*\s*(\d{2}\/\d{2}\/\d{4})/);
  
  const versionDate = match ? match[1] : 'N/D';
  
  const content = `// Este arquivo é gerado automaticamente pelo script scripts/sync-version.cjs\nexport const SYSTEM_VERSION_DATE = "${versionDate}";\n`;
  
  fs.writeFileSync(outputPath, content);
  console.log(`[VersionSync] Data de atualização sincronizada: ${versionDate}`);
} catch (error) {
  console.error('[VersionSync] Erro ao sincronizar versão:', error.message);
  // Garante que o arquivo exista mesmo em caso de erro
  if (!fs.existsSync(outputPath)) {
    fs.writeFileSync(outputPath, 'export const SYSTEM_VERSION_DATE = "N/D";\n');
  }
}
