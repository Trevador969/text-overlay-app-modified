import type { TextLayer, ImageAdjust } from './types'

let counter = 0

export function makeLayer(overrides?: Partial<TextLayer>): TextLayer {
  return {
    id: `layer-${++counter}-${Date.now()}`,
    text: 'Novo texto',
    x: 0.5,
    y: 0.75,
    fontSize: 52,
    fontFamily: 'Impact',
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 1,
    shadow: true,
    shadowColor: '#000000',
    align: 'center',
    strokeWidth: 2.5,
    ...overrides,
  }
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

let imgCounter = 0
export function makeImageId() {
  return `img-${++imgCounter}-${Date.now()}`
}
