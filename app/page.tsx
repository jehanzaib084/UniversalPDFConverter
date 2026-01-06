"use client"
import type React from "react"
import { useState, useRef, useCallback } from "react"
import Image from "next/image" // Import Next.js Image component
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Upload, ArrowLeft, ArrowRight, X, RotateCw, Trash2, ChevronDown, ChevronUp, Crop } from "lucide-react"
import jsPDF from "jspdf"
import { processImageOnCanvas } from "@/lib/image-utils"

interface ImageFile {
  id: string
  file: File
  dataUrl: string // Current data URL (might be rotated)
  originalDataUrl: string // Original data URL from file reader
  name: string
  size: number
  rotation: number // 0, 90, 180, 270
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // PDF Options State
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4")
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [imageQuality, setImageQuality] = useState<number>(90) // 0-100
  const [autoOptimizeImages, setAutoOptimizeImages] = useState<boolean>(true)
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false) // Initialized to false, so it's closed by default

  // Drag and Drop State
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null)

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
      setError(null)
      setSuccessMessage(null)

      let files: FileList | null = null

      // Type guard to correctly access files based on event type
      if ("dataTransfer" in event) {
        files = event.dataTransfer.files
      } else if ("files" in event.target) {
        files = event.target.files
      }

      if (!files || files.length === 0) return

      const newImages: ImageFile[] = []
      const filePromises: Promise<void>[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith("image/")) {
          filePromises.push(
            new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => {
                if (e.target?.result) {
                  const dataUrl = e.target.result as string
                  newImages.push({
                    id: `${file.name}-${Date.now()}-${Math.random()}`,
                    file,
                    dataUrl: dataUrl,
                    originalDataUrl: dataUrl,
                    name: file.name,
                    size: file.size,
                    rotation: 0,
                  })
                }
                resolve()
              }
              reader.readAsDataURL(file)
            }),
          )
        } else {
          setError(
            (prev) => (prev ? `${prev}\n` : "") + `Unsupported file type: ${file.name}. Only image files are allowed.`,
          )
        }
      }
      await Promise.all(filePromises)
      setImages((prevImages) => [...prevImages, ...newImages].sort((a, b) => a.name.localeCompare(b.name)))
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      handleFileChange(event)
    },
    [handleFileChange],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages((prevImages) => prevImages.filter((img) => img.id !== id))
    setError(null)
    setSuccessMessage(null)
  }, [])

  const rotateImage = useCallback(async (id: string) => {
    setImages((prevImages) =>
      prevImages.map((img) => {
        if (img.id === id) {
          const newRotation = (img.rotation + 90) % 360
          return { ...img, rotation: newRotation }
        }
        return img
      }),
    )
  }, [])

  const handleCropClick = useCallback((imageName: string) => {
    alert(`Cropping feature for "${imageName}" is under development.`)
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedImageId(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
  }, [])

  const handleDragOverImage = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault()
      if (draggedImageId !== id) {
        const draggedIndex = images.findIndex((img) => img.id === draggedImageId)
        const targetIndex = images.findIndex((img) => img.id === id)
        if (draggedIndex === -1 || targetIndex === -1) return

        const newImages = [...images]
        const [removed] = newImages.splice(draggedIndex, 1)
        newImages.splice(targetIndex, 0, removed)
        setImages(newImages)
      }
    },
    [draggedImageId, images],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedImageId(null)
  }, [])

  const moveImage = useCallback((id: string, direction: "left" | "right") => {
    setImages((prevImages) => {
      const index = prevImages.findIndex((img) => img.id === id)
      if (index === -1) return prevImages
      const newIndex = direction === "left" ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prevImages.length) return prevImages

      const newImages = [...prevImages]
      const [movedImage] = newImages.splice(index, 1)
      newImages.splice(newIndex, 0, movedImage)
      return newImages
    })
  }, [])

  const convertToPdf = useCallback(async () => {
    if (images.length === 0) {
      setError("Please upload at least one image to convert.")
      return
    }

    setIsConverting(true)
    setProgress(0)
    setError(null)
    setSuccessMessage(null)

    try {
      const doc = new jsPDF({
        unit: "pt",
        format: pageSize,
        orientation: orientation,
      })

      const totalImages = images.length
      let processedImagesCount = 0

      for (const image of images) {
        const currentImageQuality = autoOptimizeImages ? 0.8 : imageQuality / 100
        const processedDataUrl = await processImageOnCanvas(
          image.originalDataUrl,
          image.rotation,
          currentImageQuality,
          image.file.type,
        )

        const img = new window.Image() // Use window.Image to avoid conflicts with Next.js Image component
        img.src = processedDataUrl
        img.crossOrigin = "anonymous"

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const imgWidth = img.width
            const imgHeight = img.height

            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()

            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
            const scaledWidth = imgWidth * ratio
            const scaledHeight = imgHeight * ratio

            const x = (pageWidth - scaledWidth) / 2
            const y = (pageHeight - scaledHeight) / 2

            if (processedImagesCount > 0) {
              doc.addPage()
            }

            const imageFormat = image.file.type.split("/")[1]?.toUpperCase() || "JPEG"
            doc.addImage(img.src, imageFormat, x, y, scaledWidth, scaledHeight)

            processedImagesCount++
            setProgress(Math.round((processedImagesCount / totalImages) * 100))
            resolve()
          }
          img.onerror = (err) => {
            console.error("Image loading error for PDF:", err)
            reject(new Error(`Failed to load image for PDF: ${image.name}`))
          }
        })
      }

      doc.save("converted-images.pdf")
      setSuccessMessage("PDF converted and downloaded successfully!")
      setImages([])
    } catch (err) {
      console.error("PDF conversion error:", err)
      setError(`PDF conversion failed: ${(err as Error).message || "An unknown error occurred."}`)
    } finally {
      setIsConverting(false)
      setProgress(0)
    }
  }, [images, pageSize, orientation, imageQuality, autoOptimizeImages])

  const clearAllImages = useCallback(() => {
    setImages([])
    setError(null)
    setSuccessMessage(null)
  }, [])

  return (
    <TooltipProvider>
      {" "}
      {/* Wrap the entire component with TooltipProvider */}
      <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader>
            <h1 className="text-4xl font-bold text-center">Image to PDF Converter</h1>
            <p className="text-center text-lg text-gray-600 dark:text-gray-400 mt-2">
              Convert any image format (JPG, PNG, WebP, GIF, etc.) into a single PDF document, fast and free.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">
              <p className="mb-4">
                Our <strong className="text-green-600 dark:text-green-400">Image to PDF Converter</strong> is the
                ultimate <strong className="text-green-600 dark:text-green-400">online</strong> tool for transforming
                your photos, screenshots, and scanned documents into professional PDF files. Experience{" "}
                <strong className="text-green-600 dark:text-green-400">lightning-fast</strong>, client-side conversion
                that keeps your files secure and your workflow{" "}
                <strong className="text-green-600 dark:text-green-400">efficient</strong>.
              </p>
              <p>
                It&apos;s completely <strong className="text-green-600 dark:text-green-400">free</strong>, works right
                in your browser, and delivers results with incredible{" "}
                <strong className="text-green-600 dark:text-green-400">speed</strong>. Convert JPG to PDF, PNG to PDF,
                WebP to PDF, and more, all in one place!
              </p>
            </div>
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="Upload images"
              tabIndex={0}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <p className="mt-4 text-lg font-medium">Drag & drop images here, or click to select files</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Supports all common image formats</p>
            </div>
            {/* Image Previews & Management */}
            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Selected Images ({images.length})</h2>
                  <Button variant="outline" onClick={clearAllImages} aria-label="Clear all images">
                    <Trash2 className="h-4 w-4 mr-2" /> Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <Card
                      key={image.id}
                      className={`relative group overflow-hidden ${draggedImageId === image.id ? "opacity-50" : ""}`}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, image.id)}
                      onDragOver={(e) => handleDragOverImage(e, image.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <Image // Replaced <img> with <Image />
                        src={image.dataUrl || "/placeholder.svg"}
                        alt={`Preview of ${image.name}`}
                        className="w-full h-32 object-cover rounded-t-lg"
                        width={128} // Required for Next.js Image
                        height={128} // Required for Next.js Image
                        style={{ transform: `rotate(${image.rotation}deg)` }}
                      />
                      <div className="p-3 text-sm">
                        <p className="font-medium truncate" title={image.name}>
                          {image.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">{(image.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => rotateImage(image.id)}
                              aria-label={`Rotate ${image.name} 90 degrees clockwise`}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Rotate 90° Clockwise</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleCropClick(image.name)}
                              aria-label={`Crop ${image.name}`}
                            >
                              <Crop className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Crop Image (Coming Soon)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => moveImage(image.id, "left")}
                              disabled={index === 0}
                              aria-label={`Move ${image.name} left`}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Move Left</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => moveImage(image.id, "right")}
                              disabled={index === images.length - 1}
                              aria-label={`Move ${image.name} right`}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Move Right</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeImage(image.id)}
                              aria-label={`Remove ${image.name}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Remove Image</TooltipContent>
                        </Tooltip>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {/* Collapsible PDF Options */}
            <Collapsible
              open={isCollapsibleOpen}
              onOpenChange={setIsCollapsibleOpen}
              className="w-full space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-lg font-semibold">
                  Customize PDF Options
                  {isCollapsibleOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Page Size */}
                  <div className="space-y-2">
                    <Label htmlFor="page-size">Page Size</Label>
                    {/* Corrected onValueChange prop */}
                    <Select value={pageSize} onValueChange={(value) => setPageSize(value as "a4" | "letter")}>
                      <SelectTrigger id="page-size" className="w-full">
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Orientation */}
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    {/* Corrected onValueChange prop */}
                    <Select
                      value={orientation}
                      onValueChange={(value) => setOrientation(value as "portrait" | "landscape")}
                    >
                      <SelectTrigger id="orientation" className="w-full">
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Image Quality / Compression */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="image-quality" className={autoOptimizeImages ? "opacity-50" : ""}>
                      Image Quality (JPEG)
                    </Label>
                    <span
                      className={`text-sm text-gray-500 dark:text-gray-400 ${autoOptimizeImages ? "opacity-50" : ""}`}
                    >
                      {imageQuality}%
                    </span>
                  </div>
                  <Slider
                    id="image-quality"
                    min={0}
                    max={100}
                    step={5}
                    value={[imageQuality]}
                    onValueChange={(val) => setImageQuality(val[0])}
                    disabled={autoOptimizeImages}
                    className={autoOptimizeImages ? "opacity-50 cursor-not-allowed" : ""}
                    aria-label="Image quality slider"
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="auto-optimize"
                      checked={autoOptimizeImages}
                      onCheckedChange={(checked) => setAutoOptimizeImages(!!checked)}
                    />
                    <Label htmlFor="auto-optimize">Auto-optimize images (recommended for smaller files)</Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            {/* Conversion Button & Feedback */}
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={convertToPdf}
                disabled={images.length === 0 || isConverting}
                className="w-full max-w-xs py-3 text-lg font-semibold"
              >
                {isConverting ? "Converting..." : "Convert to PDF"}
              </Button>
              {isConverting && (
                <div className="w-full max-w-xs space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                    {progress}% converted
                  </p>
                </div>
              )}
              {error && (
                <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">Conversion Error</AlertDialogTitle>
                      <AlertDialogDescription>{error}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction onClick={() => setError(null)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {successMessage && (
                <AlertDialog open={!!successMessage} onOpenChange={() => setSuccessMessage(null)}>
                  <AlertDialogContent onEscapeKeyDown={() => setSuccessMessage(null)}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-green-600">Success!</AlertDialogTitle>
                      <AlertDialogDescription>{successMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction onClick={() => setSuccessMessage(null)}>Great!</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </TooltipProvider>
  )
}
