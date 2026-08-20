// Minimal .env reader so these scripts run with plain `node` on a server that
// has no dotenv installed. Values already set in the real environment win, so
// running under pm2 or with DATABASE_URL exported behaves as you'd expect.
const fs = require('fs')
const path = require('path')

module.exports = function loadEnv(dir = path.join(__dirname, '..')) {
  for (const file of ['.env', '.env.local']) {
    const full = path.join(dir, file)
    if (!fs.existsSync(full)) continue
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (!match) continue
      const [, key, rawValue] = match
      let value = rawValue
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      // Don't clobber a variable the server already exports — this matches
      // how Prisma itself reads .env, so these scripts always talk to the same
      // database `prisma db push` just touched.
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}
