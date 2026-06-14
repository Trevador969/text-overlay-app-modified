export type TextAlign = 'left' | 'center' | 'right'
export type SnapPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'mid-left' | 'mid-center' | 'mid-right'
  | 'bot-left' | 'bot-center' | 'bot-right'

export interface TextLayer {
  id: string
  text: string
  x: number          // 0–1 (fraction of image width)
  y: number          // 0–1 (fraction of image height)
  fontSize: number   // px at 1000px wide reference
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  color: string
  opacity: number
  shadow: boolean
  shadowColor: string
  align: TextAlign
  strokeWidth: number
}

export interface ImageAdjust {
  opacity: number      // 0–1
  brightness: number   // 0–200 (100 = normal)
  contrast: number     // 0–200
  saturate: number     // 0–200
  blur: number         // 0–10px
}

export interface ImageEntry {
  id: string
  name: string
  src: string        // data URL
  width: number
  height: number
  layers: TextLayer[]
  activeLayerId: string | null
  adjust: ImageAdjust
  audioSrc: string | null
  audioName: string | null
}
