/**
 * Extracts images from reference posts and creates a brand image library
 * Uses real images from your posts - no AI generation
 */

export interface BrandImage {
  id: string
  url: string
  sourceUrl: string // Original post URL
  platform: string
  extractedAt: string
  tags?: string[]
  description?: string
}

export async function extractImagesFromUrl(url: string): Promise<string[]> {
  try {
    // Call backend API to extract images
    const response = await fetch(
      `/api/extract-images?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to extract images')
    }

    const data = await response.json()
    return data.images || []
  } catch (error) {
    console.error('Error extracting images:', error)
    return []
  }
}

export function analyzeImageContent(imageUrl: string): Promise<{
  colors: string[]
  objects: string[]
  style: string
}> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Basic image analysis
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve({ colors: [], objects: [], style: 'unknown' })
        return
      }

      ctx.drawImage(img, 0, 0)
      
      // Extract dominant colors
      const imageData = ctx.getImageData(0, 0, Math.min(img.width, 100), Math.min(img.height, 100))
      const colors = extractDominantColors(imageData)
      
      // Basic style detection
      const style = detectImageStyle(img.width, img.height, colors)
      
      resolve({
        colors,
        objects: [], // Would need ML model for object detection
        style,
      })
    }

    img.onerror = () => {
      resolve({ colors: [], objects: [], style: 'unknown' })
    }

    img.src = imageUrl
  })
}

function extractDominantColors(imageData: ImageData): string[] {
  const colorMap = new Map<string, number>()
  const data = imageData.data

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const color = `rgb(${r},${g},${b})`
    colorMap.set(color, (colorMap.get(color) || 0) + 1)
  }

  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color)
}

function detectImageStyle(
  width: number,
  height: number,
  colors: string[]
): string {
  const aspectRatio = width / height
  const isSquare = Math.abs(aspectRatio - 1) < 0.1
  const isPortrait = aspectRatio < 0.8
  const isLandscape = aspectRatio > 1.2

  if (isSquare) return 'square'
  if (isPortrait) return 'portrait'
  if (isLandscape) return 'landscape'
  return 'standard'
}
