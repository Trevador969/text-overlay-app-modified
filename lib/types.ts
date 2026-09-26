export type TextAlign =
  | 'left'
  | 'center'
  | 'right'

export type SnapPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'mid-left'
  | 'mid-center'
  | 'mid-right'
  | 'bot-left'
  | 'bot-center'
  | 'bot-right'

export type MediaType =
  | 'image'
  | 'video'

export interface TextLayer {
  id: string

  text: string

  // posição proporcional de 0 até 1
  x: number
  y: number

  fontFamily: string
  fontSize: number

  fontWeight:
  | 'normal'
  | 'bold'

  color: string

  align: TextAlign

  opacity: number

  strokeWidth: number
  strokeColor: string

  shadow: boolean
  shadowColor: string
}

export interface ImageAdjust {
  opacity: number
  brightness: number
  contrast: number
  saturate: number
  blur: number
}

export interface ImageEntry {
  id: string

  name: string

  src: string

  mediaType: MediaType

  width: number
  height: number

  duration?: number

  layers: TextLayer[]

  activeLayerId:
  | string
  | null

  adjust: ImageAdjust

  audioSrc:
  | string
  | null

  audioName:
  | string
  | null
}