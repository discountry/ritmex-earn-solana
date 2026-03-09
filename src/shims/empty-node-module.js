const unsupported = (name) => {
  throw new Error(`${name} is not available in React Native`)
}

module.exports = {
  sep: '/',
  delimiter: ':',
  basename: () => unsupported('path.basename'),
  dirname: () => unsupported('path.dirname'),
  extname: () => unsupported('path.extname'),
  join: () => unsupported('path.join'),
  normalize: () => unsupported('path.normalize'),
  parse: () => unsupported('path.parse'),
  readFileSync: () => unsupported('fs.readFileSync'),
  readdirSync: () => unsupported('fs.readdirSync'),
  existsSync: () => unsupported('fs.existsSync'),
}
