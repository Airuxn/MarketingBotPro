/**
 * Image editing utilities for adapting brand images
 * Uses real image manipulation, not AI generation
 */

export interface EditOptions {
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  resize?: {
    width: number
    height: number
  }
  addText?: {
    text: string
    x: number
    y: number
    fontSize: number
    color: string
    fontFamily?: string
  }
  addOverlay?: {
    color: string
    opacity: number
  }
}

export async function editImage(
  imageUrl: string,
  options: EditOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Apply resize if specified
      if (options.resize) {
        width = options.resize.width
        height = options.resize.height
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw original image
      if (options.crop) {
        ctx.drawImage(
          img,
          options.crop.x,
          options.crop.y,
          options.crop.width,
          options.crop.height,
          0,
          0,
          width,
          height
        )
      } else {
        ctx.drawImage(img, 0, 0, width, height)
      }

      // Add overlay if specified
      if (options.addOverlay) {
        ctx.fillStyle = options.addOverlay.color
        ctx.globalAlpha = options.addOverlay.opacity
        ctx.fillRect(0, 0, width, height)
        ctx.globalAlpha = 1.0
      }

      // Add text if specified
      if (options.addText) {
        ctx.fillStyle = options.addText.color
        ctx.font = `${options.addText.fontSize}px ${options.addText.fontFamily || 'Arial'}`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(
          options.addText.text,
          options.addText.x,
          options.addText.y
        )
      }

      // Convert to data URL
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }

          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/png',
        0.95
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = imageUrl
  })
}

export async function adaptImageForPlatform(
  imageUrl: string,
  platform: string,
  targetDimensions?: { width: number; height: number }
): Promise<string> {
  // Get platform specs
  const platformSpecs = {
    twitter: { width: 1200, height: 675 },
    linkedin: { width: 1200, height: 627 },
    facebook: { width: 1200, height: 630 },
    instagram: { width: 1080, height: 1080 },
  }

  const target = targetDimensions || platformSpecs[platform as keyof typeof platformSpecs] || { width: 1200, height: 675 }

  return editImage(imageUrl, {
    resize: target,
  })
}
