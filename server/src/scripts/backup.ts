/**
 * Script de backup de MongoDB.
 *
 * Uso:
 *   npm run backup
 *
 * Guarda los backups en ./backups/ con timestamp.
 * Mantiene los últimos 7 — los más viejos se eliminan automáticamente.
 *
 * Para automatizar (cron diario a las 3am en Linux/Mac):
 *   0 3 * * * cd /path/to/server && npm run backup >> logs/backup.log 2>&1
 */

import 'dotenv/config'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'

const KEEP_LAST = 7
const BACKUP_DIR = path.join(process.cwd(), 'backups')

function run(): void {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('[BACKUP] MONGODB_URI no está configurado')
    process.exit(1)
  }

  // Crear directorio si no existe
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`)

  console.log(`[BACKUP] Iniciando backup → ${backupPath}`)

  exec(
    `mongodump --uri="${uri}" --out="${backupPath}"`,
    (err, _stdout, stderr) => {
      if (err) {
        console.error('[BACKUP] ✗ Error ejecutando mongodump:', err.message)
        if (stderr) console.error(stderr)
        process.exit(1)
      }

      console.log(`[BACKUP] ✓ Backup completado: ${backupPath}`)

      // Rotar: eliminar backups más viejos si hay más de KEEP_LAST
      const all = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith('backup-'))
        .sort()
        .reverse()

      const toDelete = all.slice(KEEP_LAST)
      for (const old of toDelete) {
        const oldPath = path.join(BACKUP_DIR, old)
        fs.rmSync(oldPath, { recursive: true, force: true })
        console.log(`[BACKUP] Backup antiguo eliminado: ${old}`)
      }

      console.log(`[BACKUP] Total backups guardados: ${Math.min(all.length, KEEP_LAST)}`)
    }
  )
}

run()
