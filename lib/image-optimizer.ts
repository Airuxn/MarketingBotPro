/**
 * Client-side image optimization utilities
 * For production, consider using a service like Cloudinary, Imgix, or Next.js Image Optimization
 */

export interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }

          const optimizedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, `.${format}`),
            {
              type: `image/${format}`,
              lastModified: Date.now(),
            }
          )

          URL.revokeObjectURL(objectUrl)
          resolve(optimizedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.9
): Promise<File> {
  return optimizeImage(file, {
    maxWidth: targetWidth,
    maxHeight: targetHeight,
    quality,
  })
}
