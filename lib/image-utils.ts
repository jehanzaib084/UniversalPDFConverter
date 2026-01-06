export async function processImageOnCanvas(
  dataUrl: string,
  rotation: number, // 0, 90, 180, 270
  quality: number | null, // 0.0 to 1.0, null means no specific compression
  mimeType: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = dataUrl
    img.crossOrigin = "anonymous" // Essential for images loaded from data URLs in some browsers

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      const width = img.width
      const height = img.height

      // Adjust canvas dimensions for rotation
      if (rotation === 90 || rotation === 270) {
        canvas.width = height
        canvas.height = width
      } else {
        canvas.width = width
        canvas.height = height
      }

      // Apply rotation transformation
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -width / 2, -height / 2, width, height)
      ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform

      // Determine output MIME type and quality
      let outputMimeType = mimeType
      // GIFs are not directly supported for quality compression in toDataURL, convert to PNG
      if (mimeType === "image/gif") {
        outputMimeType = "image/png"
      } else if (mimeType === "image/webp" && quality !== null) {
        // WebP compression might not be universally supported by toDataURL with quality, fallback to JPEG
        outputMimeType = "image/jpeg"
      } else if (quality !== null && !mimeType.includes("jpeg")) {
        // If quality is specified and not already JPEG, convert to JPEG for consistent quality control
        outputMimeType = "image/jpeg"
      }

      const finalQuality = quality !== null ? quality : 1.0 // 1.0 means no compression

      try {
        resolve(canvas.toDataURL(outputMimeType, finalQuality))
      } catch (e) {
        console.error("Error converting canvas to data URL:", e)
        reject(new Error(`Failed to process image on canvas: ${e}`))
      }
    }
    img.onerror = (err) => {
      console.error("Image loading error for canvas processing:", err)
      reject(new Error("Failed to load image for processing."))
    }
  })
}
