// Tiny logger. Every message is scrubbed so that a database password can
// never end up in the console or in Render's log viewer.

const scrub = (text) =>
  String(text).replace(/(mongodb(?:\+srv)?:\/\/)([^@\s/]+)@/gi, '$1***:***@');

const stamp = () => new Date().toISOString();

const format = (level, message) => `[${stamp()}] ${level} ${scrub(message)}`;

module.exports = {
  info: (message) => console.log(format('INFO ', message)),
  warn: (message) => console.warn(format('WARN ', message)),
  error: (message) => console.error(format('ERROR', message)),
  scrub,
};
