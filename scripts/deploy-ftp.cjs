const FtpDeploy = require("ftp-deploy");
const path = require("path");

const ftpDeploy = new FtpDeploy();

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: 21,
  localRoot: path.resolve(__dirname, "../dist"),
  remoteRoot: process.env.FTP_REMOTE_PATH || "/public_html",
  include: ["*", "**/*"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

console.log(`\n📦 Iniciando deploy para ${config.host}${config.remoteRoot}...\n`);

ftpDeploy.on("uploading", (data) => {
  const pct = Math.round((data.transferredFileCount / data.totalFilesCount) * 100);
  process.stdout.write(`\r[${pct}%] ${data.filename}`);
});

ftpDeploy.on("uploaded", (data) => {
  if (data.transferredFileCount === data.totalFilesCount) {
    console.log(`\n\n✅ Deploy concluído: ${data.totalFilesCount} arquivos enviados.`);
  }
});

ftpDeploy
  .deploy(config)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Erro no deploy:", err.message || err);
    process.exit(1);
  });
