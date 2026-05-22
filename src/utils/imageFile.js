// Resize a local image file to a small JPEG data URL for storing in the avatar field.
// Keeps payloads small enough for SQLite + express JSON without a separate upload API.

const MAX_INPUT_BYTES = 5 * 1024 * 1024 // 5 MB before resize
const MAX_DIMENSION = 256
const JPEG_QUALITY = 0.82

export async function fileToAvatarDataUrl(file) {
  if (!file) throw new Error('No file selected')

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP).')
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image is too large. Please use a file under 5 MB.')
  }

  const bitmap = await loadImageBitmap(file)
  const { width, height } = fitInside(bitmap.width, bitmap.height, MAX_DIMENSION)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)

  if (bitmap.close) bitmap.close()

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

function fitInside(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h }
  const scale = max / Math.max(w, h)
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  }
}

function loadImageBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
}
