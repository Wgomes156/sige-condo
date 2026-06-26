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
  include: [".htaccess"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

ftpDeploy
  .deploy(config)
  .then(() => console.log("✅ .htaccess enviado com sucesso."))
  .catch((err) => {
    console.error("❌ Erro:", err.message || err);
    process.exit(1);
  });
