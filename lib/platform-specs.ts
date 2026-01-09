export interface PlatformSpecs {
  name: string
  image: {
    minWidth: number
    minHeight: number
    maxWidth: number
    maxHeight: number
    aspectRatios: string[]
    maxSizeMB: number
    formats: string[]
    recommended: { width: number; height: number }
  }
  video: {
    minWidth: number
    minHeight: number
    maxWidth: number
    maxHeight: number
    maxSizeMB: number
    maxDurationSeconds: number
    formats: string[]
    aspectRatios: string[]
    recommended: { width: number; height: number }
  }
}

export const platformSpecs: Record<string, PlatformSpecs> = {
  twitter: {
    name: 'Twitter/X',
    image: {
      minWidth: 200,
      minHeight: 200,
      maxWidth: 4096,
      maxHeight: 4096,
      aspectRatios: ['1:1', '16:9', '4:3'],
      maxSizeMB: 5,
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      recommended: { width: 1200, height: 675 }, // 16:9
    },
    video: {
      minWidth: 320,
      minHeight: 180,
      maxWidth: 1920,
      maxHeight: 1080,
      maxSizeMB: 512,
      maxDurationSeconds: 140,
      formats: ['mp4', 'mov'],
      aspectRatios: ['16:9', '1:1'],
      recommended: { width: 1280, height: 720 },
    },
  },
  linkedin: {
    name: 'LinkedIn',
    image: {
      minWidth: 200,
      minHeight: 200,
      maxWidth: 7680,
      maxHeight: 4320,
      aspectRatios: ['1:1', '1.91:1', '4:5'],
      maxSizeMB: 10,
      formats: ['jpg', 'jpeg', 'png', 'gif'],
      recommended: { width: 1200, height: 627 }, // 1.91:1
    },
    video: {
      minWidth: 256,
      minHeight: 144,
      maxWidth: 4096,
      maxHeight: 2304,
      maxSizeMB: 200,
      maxDurationSeconds: 600,
      formats: ['mp4'],
      aspectRatios: ['16:9', '1:1'],
      recommended: { width: 1920, height: 1080 },
    },
  },
  facebook: {
    name: 'Facebook',
    image: {
      minWidth: 200,
      minHeight: 200,
      maxWidth: 2048,
      maxHeight: 2048,
      aspectRatios: ['1:1', '16:9', '4:5', '9:16'],
      maxSizeMB: 4,
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      recommended: { width: 1200, height: 630 }, // 1.91:1
    },
    video: {
      minWidth: 120,
      minHeight: 120,
      maxWidth: 1920,
      maxHeight: 1080,
      maxSizeMB: 1024,
      maxDurationSeconds: 240,
      formats: ['mp4', 'mov'],
      aspectRatios: ['16:9', '1:1', '4:5', '9:16'],
      recommended: { width: 1280, height: 720 },
    },
  },
  instagram: {
    name: 'Instagram',
    image: {
      minWidth: 320,
      minHeight: 320,
      maxWidth: 1080,
      maxHeight: 1350,
      aspectRatios: ['1:1', '4:5', '16:9'],
      maxSizeMB: 8,
      formats: ['jpg', 'jpeg', 'png'],
      recommended: { width: 1080, height: 1080 }, // 1:1 square
    },
    video: {
      minWidth: 600,
      minHeight: 600,
      maxWidth: 1080,
      maxHeight: 1350,
      maxSizeMB: 100,
      maxDurationSeconds: 60,
      formats: ['mp4', 'mov'],
      aspectRatios: ['1:1', '4:5', '16:9'],
      recommended: { width: 1080, height: 1080 },
    },
  },
}

export function validateMedia(
  file: File,
  platform: string,
  type: 'image' | 'video'
): { valid: boolean; error?: string; warnings?: string[] } {
  const specs = platformSpecs[platform]
  if (!specs) {
    return { valid: false, error: 'Unknown platform' }
  }

  const mediaSpecs = type === 'image' ? specs.image : specs.video
  const warnings: string[] = []

  // Check file format
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !mediaSpecs.formats.includes(extension)) {
    return {
      valid: false,
      error: `Invalid format. Allowed: ${mediaSpecs.formats.join(', ')}`,
    }
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > mediaSpecs.maxSizeMB) {
    return {
      valid: false,
      error: `File too large. Maximum: ${mediaSpecs.maxSizeMB}MB`,
    }
  }

  // For images, we'll validate dimensions after loading
  // For videos, we'll need to check duration and dimensions

  return { valid: true, warnings }
}

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

export function checkAspectRatio(
  width: number,
  height: number,
  platform: string,
  type: 'image' | 'video'
): boolean {
  const specs = platformSpecs[platform]
  if (!specs) return false

  const mediaSpecs = type === 'image' ? specs.image : specs.video
  const aspectRatio = calculateAspectRatio(width, height)

  // Check if aspect ratio matches any allowed ratio (with some tolerance)
  return mediaSpecs.aspectRatios.some((ratio) => {
    const [w, h] = ratio.split(':').map(Number)
    const targetRatio = w / h
    const actualRatio = width / height
    return Math.abs(targetRatio - actualRatio) < 0.1 // 10% tolerance
  })
}
