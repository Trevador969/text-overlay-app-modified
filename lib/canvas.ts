import type {
  ImageAdjust,
  SnapPosition,
  TextLayer,
} from '@/lib/types'

export function buildFilter(
  adjust:
    ImageAdjust
) {
  return [
    `brightness(${adjust.brightness}%)`,
    `contrast(${adjust.contrast}%)`,
    `saturate(${adjust.saturate}%)`,
    `blur(${adjust.blur}px)`,
  ].join(' ')
}

export function drawLayer(
  ctx:
    CanvasRenderingContext2D,

  layer:
    TextLayer,

  canvasWidth:
    number,

  canvasHeight:
    number
) {
  ctx.save()

  const x =
    layer.x *
    canvasWidth

  const y =
    layer.y *
    canvasHeight

  /*
  O tamanho salvo é baseado
  aproximadamente em uma mídia
  de 1080px.

  Assim fica proporcional entre
  diferentes resoluções.
  */

  const scale =
    canvasWidth /
    1080

  const fontSize =
    Math.max(
      1,
      layer.fontSize *
      scale
    )

  ctx.font =
    `${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`

  ctx.textAlign =
    layer.align

  ctx.textBaseline =
    'middle'

  ctx.globalAlpha =
    layer.opacity

  /*
  ============================================================
  SOMBRA
  ============================================================
  */

  if (
    layer.shadow
  ) {
    ctx.shadowColor =
      layer.shadowColor

    ctx.shadowBlur =
      Math.max(
        3,
        fontSize *
        0.12
      )

    ctx.shadowOffsetX =
      0

    ctx.shadowOffsetY =
      Math.max(
        2,
        fontSize *
        0.04
      )
  } else {
    ctx.shadowColor =
      'transparent'

    ctx.shadowBlur =
      0

    ctx.shadowOffsetX =
      0

    ctx.shadowOffsetY =
      0
  }

  /*
  ============================================================
  MULTILINE
  ============================================================
  */

  const lines =
    layer.text.split(
      '\n'
    )

  const lineHeight =
    fontSize *
    1.15

  const totalHeight =
    (
      lines.length -
      1
    ) *
    lineHeight

  lines.forEach(
    (
      text,
      index
    ) => {
      const lineY =
        y -
        totalHeight /
        2 +
        index *
        lineHeight

      /*
      ========================================================
      BORDA
      ========================================================
      */

      if (
        layer.strokeWidth >
        0
      ) {
        ctx.lineJoin =
          'round'

        ctx.miterLimit =
          2

        ctx.lineWidth =
          layer.strokeWidth *
          2 *
          scale

        ctx.strokeStyle =
          layer.strokeColor

        ctx.strokeText(
          text,
          x,
          lineY
        )
      }

      /*
      ========================================================
      TEXTO
      ========================================================
      */

      ctx.fillStyle =
        layer.color

      ctx.fillText(
        text,
        x,
        lineY
      )
    }
  )

  ctx.restore()
}

export function renderToCanvas(
  canvas:
    HTMLCanvasElement,

  image:
    HTMLImageElement,

  layers:
    TextLayer[],

  adjust:
    ImageAdjust
) {
  canvas.width =
    image.naturalWidth

  canvas.height =
    image.naturalHeight

  const ctx =
    canvas.getContext(
      '2d'
    )

  if (!ctx) {
    return
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  ctx.save()

  ctx.filter =
    buildFilter(
      adjust
    )

  ctx.globalAlpha =
    adjust.opacity

  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  )

  ctx.restore()

  layers.forEach(
    layer =>
      drawLayer(
        ctx,
        layer,
        canvas.width,
        canvas.height
      )
  )
}

export function exportCanvas(
  image:
    HTMLImageElement,

  layers:
    TextLayer[],

  adjust:
    ImageAdjust
) {
  const canvas =
    document.createElement(
      'canvas'
    )

  renderToCanvas(
    canvas,
    image,
    layers,
    adjust
  )

  return canvas.toDataURL(
    'image/png',
    1
  )
}

export function hitTestLayer(
  ctx:
    CanvasRenderingContext2D,

  layer:
    TextLayer,

  mouseX:
    number,

  mouseY:
    number,

  canvasWidth:
    number,

  canvasHeight:
    number
) {
  ctx.save()

  const scale =
    canvasWidth /
    1080

  const fontSize =
    Math.max(
      1,
      layer.fontSize *
      scale
    )

  ctx.font =
    `${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`

  const lines =
    layer.text.split(
      '\n'
    )

  const widths =
    lines.map(
      line =>
        ctx.measureText(
          line
        ).width
    )

  const width =
    Math.max(
      1,
      ...widths
    )

  const lineHeight =
    fontSize *
    1.15

  const height =
    Math.max(
      fontSize,
      lines.length *
      lineHeight
    )

  const x =
    layer.x *
    canvasWidth

  const y =
    layer.y *
    canvasHeight

  let left =
    x

  if (
    layer.align ===
    'center'
  ) {
    left =
      x -
      width / 2
  }

  if (
    layer.align ===
    'right'
  ) {
    left =
      x -
      width
  }

  const top =
    y -
    height / 2

  const padding =
    Math.max(
      10,
      fontSize *
      0.15
    )

  const hit =
    mouseX >=
    left -
    padding &&
    mouseX <=
    left +
    width +
    padding &&
    mouseY >=
    top -
    padding &&
    mouseY <=
    top +
    height +
    padding

  ctx.restore()

  return hit
}

export function snapCoords(
  position:
    SnapPosition
): {
  x: number
  y: number
} {
  switch (
  position
  ) {
    case 'top-left':
      return {
        x:
          0.08,
        y:
          0.1,
      }

    case 'top-center':
      return {
        x:
          0.5,
        y:
          0.1,
      }

    case 'top-right':
      return {
        x:
          0.92,
        y:
          0.1,
      }

    case 'mid-left':
      return {
        x:
          0.08,
        y:
          0.5,
      }

    case 'mid-center':
      return {
        x:
          0.5,
        y:
          0.5,
      }

    case 'mid-right':
      return {
        x:
          0.92,
        y:
          0.5,
      }

    case 'bot-left':
      return {
        x:
          0.08,
        y:
          0.9,
      }

    case 'bot-center':
      return {
        x:
          0.5,
        y:
          0.9,
      }

    case 'bot-right':
      return {
        x:
          0.92,
        y:
          0.9,
      }

    default:
      return {
        x:
          0.5,
        y:
          0.5,
      }
  }
}