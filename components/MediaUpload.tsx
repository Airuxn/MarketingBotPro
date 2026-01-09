'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Video, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { validateMedia, platformSpecs, checkAspectRatio } from '@/lib/platform-specs'

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
  width?: number
  height?: number
  size: number
  validated: boolean
  error?: string
  warnings?: string[]
}

interface MediaUploadProps {
  platform: string
  onMediaSelect: (media: MediaFile | null) => void
  maxFiles?: number
  compact?: boolean
  noBorder?: boolean // When true, removes border (for integration into parent container)
}

export function MediaUpload({ platform, onMediaSelect, maxFiles = 1, compact = false, noBorder = false }: MediaUploadProps) {
  const [media, setMedia] = useState<MediaFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const specs = platformSpecs[platform]
  const imageSpecs = specs?.image
  const videoSpecs = specs?.video

  const validateImage = async (file: File): Promise<MediaFile> => {
    return new Promise(async (resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = async () => {
        let processedFile = file
        const validation = validateMedia(file, platform, 'image')
        const aspectRatioValid = checkAspectRatio(img.width, img.height, platform, 'image')
        
        const warnings: string[] = []
        
        // Check dimensions and optimize if needed
        if (img.width > imageSpecs!.maxWidth || img.height > imageSpecs!.maxHeight) {
          try {
            // Auto-optimize oversized images
            const { optimizeImage } = await import('@/lib/image-optimizer')
            processedFile = await optimizeImage(file, {
              maxWidth: imageSpecs!.maxWidth,
              maxHeight: imageSpecs!.maxHeight,
              quality: 0.9,
            })
            warnings.push(
              `Image automatically optimized from ${img.width}x${img.height} to fit platform requirements.`
            )
            // Reload image with optimized version
            const optimizedUrl = URL.createObjectURL(processedFile)
            const optimizedImg = new Image()
            optimizedImg.onload = () => {
              URL.revokeObjectURL(optimizedUrl)
              resolve({
                file: processedFile,
                preview: optimizedUrl,
                type: 'image',
                width: optimizedImg.width,
                height: optimizedImg.height,
                size: processedFile.size,
                validated: validation.valid,
                error: validation.error,
                warnings: warnings.length > 0 ? warnings : undefined,
              })
            }
            optimizedImg.onerror = () => {
              URL.revokeObjectURL(optimizedUrl)
              // Fallback to original
              resolve({
                file,
                preview: objectUrl,
                type: 'image',
                width: img.width,
                height: img.height,
                size: file.size,
                validated: validation.valid && aspectRatioValid,
                error: validation.error,
                warnings: warnings.length > 0 ? warnings : undefined,
              })
            }
            optimizedImg.src = optimizedUrl
            return
          } catch (error) {
            warnings.push('Could not auto-optimize image. Please resize manually.')
          }
        }

        if (img.width < imageSpecs!.minWidth || img.height < imageSpecs!.minHeight) {
          warnings.push(
            `Dimensions (${img.width}x${img.height}) are below recommended minimum (${imageSpecs!.minWidth}x${imageSpecs!.minHeight})`
          )
        }

        if (!aspectRatioValid) {
          warnings.push(
            `Aspect ratio (${img.width}:${img.height}) may not be optimal for ${specs.name}. Recommended: ${imageSpecs!.aspectRatios.join(', ')}`
          )
        }

        // Check quality (file size relative to dimensions)
        const pixels = img.width * img.height
        const sizePerPixel = file.size / pixels
        if (sizePerPixel < 0.5) {
          warnings.push('Image quality may be low. Consider using a higher quality image.')
        }

        resolve({
          file: processedFile,
          preview: objectUrl,
          type: 'image',
          width: img.width,
          height: img.height,
          size: processedFile.size,
          validated: validation.valid && aspectRatioValid,
          error: validation.error,
          warnings: warnings.length > 0 ? warnings : undefined,
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Invalid image file'))
      }

      img.src = objectUrl
    })
  }

  const validateVideo = async (file: File): Promise<MediaFile> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        const validation = validateMedia(file, platform, 'video')
        const aspectRatioValid = checkAspectRatio(
          video.videoWidth,
          video.videoHeight,
          platform,
          'video'
        )

        const warnings: string[] = []

        // Check dimensions
        if (
          video.videoWidth < videoSpecs!.minWidth ||
          video.videoHeight < videoSpecs!.minHeight
        ) {
          warnings.push(
            `Dimensions (${video.videoWidth}x${video.videoHeight}) are below recommended minimum (${videoSpecs!.minWidth}x${videoSpecs!.minHeight})`
          )
        }

        if (video.duration > videoSpecs!.maxDurationSeconds) {
          warnings.push(
            `Duration (${Math.round(video.duration)}s) exceeds maximum (${videoSpecs!.maxDurationSeconds}s)`
          )
        }

        if (!aspectRatioValid) {
          warnings.push(
            `Aspect ratio may not be optimal for ${specs.name}. Recommended: ${videoSpecs!.aspectRatios.join(', ')}`
          )
        }

        resolve({
          file,
          preview: objectUrl,
          type: 'video',
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          validated: validation.valid && aspectRatioValid,
          error: validation.error,
          warnings: warnings.length > 0 ? warnings : undefined,
        })
      }

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Invalid video file'))
      }

      video.src = objectUrl
      video.load()
    })
  }

  const handleFile = async (file: File) => {
    setIsProcessing(true)
    try {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        throw new Error('Please upload an image or video file')
      }

      let mediaFile: MediaFile
      if (isImage) {
        mediaFile = await validateImage(file)
      } else {
        mediaFile = await validateVideo(file)
      }

      setMedia(mediaFile)
      onMediaSelect(mediaFile)
    } catch (error: any) {
      alert(error.message || 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [platform]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const removeMedia = () => {
    if (media?.preview) {
      URL.revokeObjectURL(media.preview)
    }
    setMedia(null)
    onMediaSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {!media ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`${noBorder ? '' : 'border-2 border-dashed'} rounded-lg transition-all ${
            compact 
              ? `p-4 ${noBorder ? '' : isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`
              : `p-8 text-center ${noBorder ? '' : isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="hidden"
            id="media-upload"
          />
          
          {isProcessing ? (
            <div className={`flex ${compact ? 'items-center space-x-3' : 'flex-col items-center space-y-4'}`}>
              <Loader2 className={`${compact ? 'w-5 h-5' : 'w-12 h-12'} text-blue-600 animate-spin`} />
              <p className="text-gray-600">{compact ? 'Processing...' : 'Processing media...'}</p>
            </div>
          ) : (
            <div className={compact ? "flex items-center justify-between" : ""}>
              <div className={compact ? "flex items-center space-x-3" : ""}>
                {compact && (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className={compact ? "" : "flex justify-center mb-4"}>
                  {!compact && (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="media-upload"
                    className={`cursor-pointer inline-block bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
                      compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'
                    }`}
                  >
                    {compact ? 'Upload New Image/Video' : 'Upload'}
                  </label>
                  {!compact && (
                    <>
                      <p className="text-sm text-gray-500 mt-2">or drag and drop here</p>
                      <div className="mt-4 text-xs text-gray-400 space-y-1">
                        {imageSpecs && (
                          <p>
                            Images: {imageSpecs.formats.join(', ').toUpperCase()} up to{' '}
                            {imageSpecs.maxSizeMB}MB
                          </p>
                        )}
                        {videoSpecs && (
                          <p>
                            Videos: {videoSpecs.formats.join(', ').toUpperCase()} up to{' '}
                            {videoSpecs.maxSizeMB}MB
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {compact && (
                <p className="text-xs text-gray-500">or drag and drop</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative bg-white rounded-xl border border-gray-200 p-4">
          <button
            onClick={removeMedia}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview */}
            <div className="relative">
              {media.type === 'image' ? (
                <img
                  src={media.preview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg object-cover max-h-64"
                />
              ) : (
                <video
                  src={media.preview}
                  controls
                  className="w-full h-auto rounded-lg max-h-64"
                />
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {media.type === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <Video className="w-5 h-5 text-purple-600" />
                )}
                <span className="font-medium text-gray-900">{media.file.name}</span>
              </div>

              <div className="space-y-2 text-sm">
                {media.width && media.height && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">
                      {media.width} × {media.height}px
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{formatFileSize(media.size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{media.type}</span>
                </div>
              </div>

              {/* Validation Status */}
              {media.validated ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Valid for {specs.name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{media.error || 'Validation failed'}</span>
                </div>
              )}

              {/* Warnings */}
              {media.warnings && media.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-800 mb-2">Warnings:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {media.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended specs */}
              {specs && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    Recommended for {specs.name}:
                  </p>
                  {media.type === 'image' ? (
                    <p className="text-xs text-blue-700">
                      {imageSpecs!.recommended.width} × {imageSpecs!.recommended.height}px
                      {' • '}
                      {imageSpecs!.aspectRatios.join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-700">
                      {videoSpecs!.recommended.width} × {videoSpecs!.recommended.height}px
                      {' • '}
                      {videoSpecs!.aspectRatios.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
