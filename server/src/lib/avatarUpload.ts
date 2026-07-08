import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { ApiError } from './apiError'

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')
export const AVATARS_DIR = path.join(UPLOADS_ROOT, 'avatars')

fs.mkdirSync(AVATARS_DIR, { recursive: true })

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
      cb(ApiError.badRequest('Avatar must be a JPEG, PNG, or WebP image', 'INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  },
})

export function saveAvatarFile(userId: string, file: Express.Multer.File): string {
  const ext = ALLOWED_MIME_TO_EXT[file.mimetype]
  const filename = `${userId}.${ext}`

  // Clear any previous avatar with a different extension so switching
  // file types doesn't leave a stale, unused file behind.
  for (const oldExt of Object.values(ALLOWED_MIME_TO_EXT)) {
    if (oldExt === ext) continue
    const oldPath = path.join(AVATARS_DIR, `${userId}.${oldExt}`)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  fs.writeFileSync(path.join(AVATARS_DIR, filename), file.buffer)
  return `/uploads/avatars/${filename}?v=${Date.now()}`
}
