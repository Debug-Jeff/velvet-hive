import multer from 'multer'
import { ApiError } from './apiError'
import { cloudinary } from './cloudinary'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest('Avatar must be a JPEG, PNG, or WebP image', 'INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  },
})

export function saveAvatarFile(userId: string, file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        // Stable public_id + overwrite means re-uploading replaces the old
        // avatar instead of accumulating orphaned images on every change.
        public_id: `avatars/${userId}`,
        overwrite: true,
        transformation: [
          { width: 512, height: 512, crop: 'fill', gravity: 'face' },
          { fetch_format: 'auto', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }
        resolve(result.secure_url)
      },
    )
    uploadStream.end(file.buffer)
  })
}
