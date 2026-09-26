import type {
  ImageAdjust,
  TextLayer,
} from '@/lib/types'

export function makeImageId() {
  if (
    typeof crypto !==
    'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID()
  }

  return `media-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function defaultAdjust(): ImageAdjust {
  return {
    opacity: 1,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
  }
}

export function makeLayer(
  patch:
    Partial<TextLayer> =
    {}
): TextLayer {
  return {
    id:
      typeof crypto !==
        'undefined' &&
        crypto.randomUUID
        ? crypto.randomUUID()
        : `layer-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

    text:
      'Seu texto',

    x:
      0.5,

    y:
      0.72,

    fontFamily:
      'Impact',

    fontSize:
      64,

    fontWeight:
      'bold',

    color:
      '#ffffff',

    align:
      'center',

    opacity:
      1,

    strokeWidth:
      3,

    strokeColor:
      '#000000',

    shadow:
      true,

    shadowColor:
      '#000000',

    ...patch,
  }
}