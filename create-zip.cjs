const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const output = fs.createWriteStream(path.join(__dirname, 'dist.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('ZIP criado: ' + archive.pointer() + ' bytes');
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

// Add all files from dist/ with correct Unix-style paths
archive.directory(path.join(__dirname, 'dist'), false);
archive.finalize();
