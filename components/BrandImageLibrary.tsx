'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Image as ImageIcon, X, Download, Check, Loader2, AlertCircle, Sparkles, Upload, Video } from 'lucide-react'
import { extractImagesFromUrl, BrandImage } from '@/lib/image-extractor'
import { useStore } from '@/lib/store'
import { validateMedia, platformSpecs } from '@/lib/platform-specs'

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

interface BrandImageLibraryProps {
  onImageSelect: (imageUrl: string) => void
  onMediaSelect?: (media: MediaFile | null) => void
  selectedImageUrl?: string
  platform: string
}

export function BrandImageLibrary({ onImageSelect, onMediaSelect, selectedImageUrl, platform }: BrandImageLibraryProps) {
  const { settings } = useStore()
  const [images, setImages] = useState<BrandImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddFromLink, setShowAddFromLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({})

  // Mark as mounted on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load and filter images by platform, show last 20
  useEffect(() => {
    if (!isMounted) return
    
    const savedImages = settings.brandImages || []
    
    // Separate auto-scanned images (from connected accounts) from manually uploaded
    const autoScannedImages = savedImages
      .filter(img => img.platform === platform && img.sourceUrl !== 'uploaded' && !img.sourceUrl.startsWith('uploaded'))
      .sort((a, b) => {
        const dateA = new Date(a.extractedAt || 0).getTime()
        const dateB = new Date(b.extractedAt || 0).getTime()
        return dateB - dateA // Newest first
      })
      .slice(0, 20) // Last 20 auto-scanned images
    
    const uploadedImages = savedImages
      .filter(img => img.platform === platform && (img.sourceUrl === 'uploaded' || img.sourceUrl.startsWith('uploaded')))
      .sort((a, b) => {
        const dateA = new Date(a.extractedAt || 0).getTime()
        const dateB = new Date(b.extractedAt || 0).getTime()
        return dateB - dateA // Newest first
      })
    
    // Combine: auto-scanned first, then uploaded
    setImages([...autoScannedImages, ...uploadedImages])
  }, [settings.brandImages, platform, isMounted])

  const extractFromLink = async () => {
    if (!linkUrl.trim()) return

    setIsLoading(true)
    try {
      const imageUrls = await extractImagesFromUrl(linkUrl)
      
      const newImages: BrandImage[] = imageUrls.map((url, index) => ({
        id: Date.now().toString() + index,
        url,
        sourceUrl: linkUrl,
        platform,
        extractedAt: new Date().toISOString(),
      }))

      setImages((prev) => {
        const updated = [...prev, ...newImages]
        // Save to settings
        const { updateSettings } = useStore.getState()
        updateSettings({
          brandImages: updated,
        })
        return updated
      })

      setLinkUrl('')
      setShowAddFromLink(false)
    } catch (error: any) {
      alert('Failed to extract images: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const removeImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id)
    setImages(updated)
    
    const { updateSettings } = useStore.getState()
    updateSettings({
      brandImages: updated,
    })
  }

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        throw new Error('Please upload an image or video file')
      }

      // For images, also add to library
      if (isImage) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          const newImage: BrandImage = {
            id: Date.now().toString() + Math.random(),
            url: imageUrl,
            sourceUrl: 'uploaded',
            platform,
            extractedAt: new Date().toISOString(),
          }

          setImages((prev) => {
            const updated = [...prev, newImage]
            // Save to settings
            setTimeout(() => {
              const { updateSettings } = useStore.getState()
              updateSettings({
                brandImages: updated,
              })
            }, 0)
            return updated
          })
        }
        reader.readAsDataURL(file)
      }

      // Validate and process media
      const specs = platformSpecs[platform]
      const validation = validateMedia(file, platform, isImage ? 'image' : 'video')
      
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      
      if (isImage) {
        img.onload = () => {
          const mediaFile: MediaFile = {
            file,
            preview: objectUrl,
            type: 'image',
            width: img.width,
            height: img.height,
            size: file.size,
            validated: validation.valid,
            error: validation.error,
          }
          setUploadedMedia(mediaFile)
          if (onMediaSelect) {
            onMediaSelect(mediaFile)
          }
          setIsProcessing(false)
        }
        img.src = objectUrl
      } else {
        // For video, create a video element to get dimensions
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          const mediaFile: MediaFile = {
            file,
            preview: objectUrl,
            type: 'video',
            width: video.videoWidth,
            height: video.videoHeight,
            size: file.size,
            validated: validation.valid,
            error: validation.error,
          }
          setUploadedMedia(mediaFile)
          if (onMediaSelect) {
            onMediaSelect(mediaFile)
          }
          setIsProcessing(false)
        }
        video.src = objectUrl
      }
    } catch (error: any) {
      alert(error.message || 'Failed to process file')
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
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
      handleFileUpload(files[0])
    }
  }

  const removeUploadedMedia = () => {
    if (uploadedMedia?.preview) {
      URL.revokeObjectURL(uploadedMedia.preview)
    }
    setUploadedMedia(null)
    if (onMediaSelect) {
      onMediaSelect(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Don't render content until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="text-center">
        <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
        <p className="text-slate-300 mb-2">Loading images...</p>
      </div>
    )
  }

  if (images.length === 0 && !showAddFromLink && !uploadedMedia) {
    return (
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            onClick={() => setShowAddFromLink(true)}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Extract from Link
          </button>
          <span className="text-slate-500 text-xs">or</span>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileInput}
              className="hidden"
              id="media-upload-library-empty"
            />
            <label
              htmlFor="media-upload-library-empty"
              className="cursor-pointer inline-block px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Upload
            </label>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Connect {platform} in Settings to auto-load images
        </p>
      </div>
    )
  }

  // Separate auto-scanned from uploaded images
  const autoScannedImages = images.filter(img => img.sourceUrl !== 'uploaded' && !img.sourceUrl.startsWith('uploaded'))
  const uploadedImages = images.filter(img => img.sourceUrl === 'uploaded' || img.sourceUrl.startsWith('uploaded'))

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Your {platform.charAt(0).toUpperCase() + platform.slice(1)} Images
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            {autoScannedImages.length > 0 && uploadedImages.length > 0 
              ? `${autoScannedImages.length} from account, ${uploadedImages.length} uploaded`
              : autoScannedImages.length > 0
              ? `Last ${autoScannedImages.length} images from your ${platform} account`
              : uploadedImages.length > 0
              ? `${uploadedImages.length} uploaded image${uploadedImages.length > 1 ? 's' : ''}`
              : 'No images yet'}
          </p>
        </div>
        <button
          onClick={() => setShowAddFromLink(!showAddFromLink)}
          className="px-3 py-1.5 text-xs glass text-slate-200 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          {showAddFromLink ? 'Cancel' : '+ Extract from Link'}
        </button>
      </div>

      {showAddFromLink && (
        <div className="glass rounded-lg p-4 border border-slate-700">
          <div className="flex space-x-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste link to a post with images..."
              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && extractFromLink()}
            />
            <button
              onClick={extractFromLink}
              disabled={isLoading || !linkUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extract'}
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Extracts real images from your posts - no AI generation, 100% authentic
          </p>
        </div>
      )}

      {/* Auto-scanned images section */}
      {autoScannedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-semibold text-white">
              From Your {platform.charAt(0).toUpperCase() + platform.slice(1)} Account ({autoScannedImages.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {autoScannedImages.map((image) => {
              const loadState = imageLoadStates[image.id] || 'loading'
              return (
                <div
                  key={image.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageUrl === image.url
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => onImageSelect(image.url)}
                >
                  {loadState === 'loading' && (
                    <div className="w-full h-32 bg-slate-800 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                    </div>
                  )}
                  {loadState === 'error' && (
                    <div className="w-full h-32 bg-slate-800 flex flex-col items-center justify-center p-2">
                      <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                      <span className="text-[10px] text-slate-400 text-center">Image failed to load</span>
                      <span className="text-[9px] text-slate-500 text-center mt-1">CORS or network issue</span>
                    </div>
                  )}
                  {loadState === 'loaded' && (
                    <img
                      src={image.url}
                      alt="Brand image"
                      className="w-full h-32 object-cover"
                      crossOrigin="anonymous"
                      onLoad={() => {
                        setImageLoadStates(prev => ({ ...prev, [image.id]: 'loaded' }))
                      }}
                      onError={(e) => {
                        console.error('[BrandImageLibrary] Image failed to load:', image.url, {
                          platform,
                          imageId: image.id,
                          error: 'CORS or network issue on mobile'
                        })
                        setImageLoadStates(prev => ({ ...prev, [image.id]: 'error' }))
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  
                  {selectedImageUrl === image.url && loadState === 'loaded' && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {loadState === 'loaded' && (
                    <>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                          Click to use
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(image.id)
                        }}
                        className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Uploaded images section */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-semibold text-white">
              Uploaded Images ({uploadedImages.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedImages.map((image) => {
              const loadState = imageLoadStates[image.id] || 'loading'
              return (
                <div
                  key={image.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageUrl === image.url
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => onImageSelect(image.url)}
                >
                  {loadState === 'loading' && (
                    <div className="w-full h-32 bg-slate-800 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                    </div>
                  )}
                  {loadState === 'error' && (
                    <div className="w-full h-32 bg-slate-800 flex flex-col items-center justify-center p-2">
                      <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                      <span className="text-[10px] text-slate-400 text-center">Image failed to load</span>
                    </div>
                  )}
                  {loadState === 'loaded' && (
                    <img
                      src={image.url}
                      alt="Uploaded image"
                      className="w-full h-32 object-cover"
                      onLoad={() => {
                        setImageLoadStates(prev => ({ ...prev, [image.id]: 'loaded' }))
                      }}
                      onError={(e) => {
                        console.error('[BrandImageLibrary] Uploaded image failed to load:', image.url, {
                          platform,
                          imageId: image.id
                        })
                        setImageLoadStates(prev => ({ ...prev, [image.id]: 'error' }))
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  
                  {selectedImageUrl === image.url && loadState === 'loaded' && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {loadState === 'loaded' && (
                    <>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                          Click to use
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(image.id)
                        }}
                        className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {autoScannedImages.length > 0 && (
        <div className="glass border border-blue-500/30 rounded-lg p-3 bg-blue-500/10">
          <p className="text-xs text-blue-200">
            <strong className="text-blue-300">✓ Auto-scanned from your {platform} account</strong>
            <br />
            <span className="text-slate-300">These images were automatically loaded from your connected {platform} account</span>
          </p>
        </div>
      )}
      
      {uploadedImages.length > 0 && (
        <div className="glass border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-200">
            <strong className="text-white">📤 Manually uploaded</strong>
            <br />
            <span className="text-slate-300">These images were uploaded from your computer</span>
          </p>
        </div>
      )}

      {/* Upload new media section - truly integrated, no border separator */}
      {!uploadedMedia ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mt-4 border-2 border-dashed rounded-lg transition-all p-4 ${
            isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="hidden"
            id="media-upload-library"
          />
          
          {isProcessing ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <p className="text-slate-300">Processing...</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <label
                  htmlFor="media-upload-library"
                  className="cursor-pointer inline-block bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium px-4 py-2 text-sm"
                >
                  Upload New Image/Video
                </label>
              </div>
              <p className="text-xs text-slate-400">or drag and drop</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 relative glass rounded-xl border border-slate-700 p-4">
          <button
            onClick={removeUploadedMedia}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-4">
            {uploadedMedia.type === 'image' ? (
              <img
                src={uploadedMedia.preview}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-800/50 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {uploadedMedia.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                ) : (
                  <Video className="w-4 h-4 text-purple-400" />
                )}
                <span className="text-sm font-medium text-white">{uploadedMedia.file.name}</span>
              </div>
              <div className="text-xs text-slate-300">
                {uploadedMedia.width && uploadedMedia.height && (
                  <span>{uploadedMedia.width} × {uploadedMedia.height}px • </span>
                )}
                {uploadedMedia.validated ? (
                  <span className="text-green-400">✓ Valid for {platform}</span>
                ) : (
                  <span className="text-red-400">⚠ {uploadedMedia.error || 'Validation failed'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
