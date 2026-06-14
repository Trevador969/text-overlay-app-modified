import type { TextLayer, ImageAdjust } from './types'

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  layers: TextLayer[],
  adjust?: ImageAdjust
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (adjust) {
    ctx.filter = buildFilter(adjust)
    ctx.globalAlpha = adjust.opacity
  }
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  layers.forEach(l => drawLayer(ctx, l, canvas.width, canvas.height))
}

export function buildFilter(adjust: ImageAdjust): string {
  return [
    `brightness(${adjust.brightness}%)`,
    `contrast(${adjust.contrast}%)`,
    `saturate(${adjust.saturate}%)`,
    adjust.blur > 0 ? `blur(${adjust.blur}px)` : '',
  ].filter(Boolean).join(' ')
}

export function drawLayer(
  ctx: CanvasRenderingContext2D,
  l: TextLayer,
  W: number,
  H: number
) {
  // fontSize stored as reference to 1000px width; scale to actual
  const scale = W / 1000
  const fs = Math.round(l.fontSize * scale)

  ctx.save()
  ctx.globalAlpha = l.opacity
  ctx.font = `${l.fontWeight} ${fs}px ${l.fontFamily}`
  ctx.textAlign = l.align
  ctx.textBaseline = 'middle'

  const x = l.x * W
  const y = l.y * H
  const lines = l.text.split('\n')
  const lineH = fs * 1.22

  const strokeW = Math.max(1, l.strokeWidth * scale)

  if (l.shadow) {
    ctx.shadowColor = l.shadowColor + 'cc'
    ctx.shadowBlur = fs * 0.35
    ctx.shadowOffsetX = strokeW
    ctx.shadowOffsetY = strokeW
  }

  // Stroke pass
  ctx.strokeStyle = l.shadowColor
  ctx.lineWidth = strokeW * 2.5
  ctx.lineJoin = 'round'
  const startY = y - ((lines.length - 1) * lineH) / 2
  lines.forEach((line, i) => {
    ctx.strokeText(line, x, startY + i * lineH)
  })

  // Fill pass
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = l.color
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineH)
  })

  ctx.restore()
}

export function hitTestLayer(
  ctx: CanvasRenderingContext2D,
  l: TextLayer,
  cx: number,
  cy: number,
  W: number,
  H: number
): boolean {
  const scale = W / 1000
  const fs = Math.round(l.fontSize * scale)
  ctx.font = `${l.fontWeight} ${fs}px ${l.fontFamily}`
  const lines = l.text.split('\n')
  const maxW = Math.max(...lines.map(ln => ctx.measureText(ln).width))
  const totalH = lines.length * fs * 1.22
  const x = l.x * W
  const y = l.y * H
  let lx = x
  if (l.align === 'center') lx -= maxW / 2
  if (l.align === 'right') lx -= maxW
  const pad = 12
  return (
    cx >= lx - pad && cx <= lx + maxW + pad &&
    cy >= y - totalH / 2 - pad && cy <= y + totalH / 2 + pad
  )
}

export function snapCoords(pos: string, pad = 0.05): { x: number; y: number } {
  const map: Record<string, { x: number; y: number }> = {
    'top-left':   { x: pad, y: pad },
    'top-center': { x: 0.5, y: pad },
    'top-right':  { x: 1 - pad, y: pad },
    'mid-left':   { x: pad, y: 0.5 },
    'mid-center': { x: 0.5, y: 0.5 },
    'mid-right':  { x: 1 - pad, y: 0.5 },
    'bot-left':   { x: pad, y: 1 - pad },
    'bot-center': { x: 0.5, y: 1 - pad },
    'bot-right':  { x: 1 - pad, y: 1 - pad },
  }
  return map[pos] ?? { x: 0.5, y: 0.7 }
}

export function exportCanvas(
  img: HTMLImageElement,
  layers: TextLayer[],
  adjust?: ImageAdjust
): string {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')!
  if (adjust) {
    ctx.filter = buildFilter(adjust)
    ctx.globalAlpha = adjust.opacity
  }
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  layers.forEach(l => drawLayer(ctx, l, c.width, c.height))
  return c.toDataURL('image/png')
}
