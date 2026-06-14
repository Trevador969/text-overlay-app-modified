'use client'
import React, { useRef, useEffect, useCallback } from 'react'
import type { ImageEntry, TextLayer } from '@/lib/types'
import { renderToCanvas, hitTestLayer, buildFilter } from '@/lib/canvas'
import styles from './CanvasEditor.module.css'

interface Props {
  entry: ImageEntry
  imgEl: HTMLImageElement | null
  onLayerMove: (layerId: string, x: number, y: number) => void
  onLayerSelect: (layerId: string) => void
}

export default function CanvasEditor({ entry, imgEl, onLayerMove, onLayerSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgEl) return
    renderToCanvas(canvas, imgEl, entry.layers, entry.adjust)
  }, [entry, imgEl])

  const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { cx: 0, cy: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      cx: (clientX - rect.left) * scaleX,
      cy: (clientY - rect.top) * scaleY,
    }
  }, [])

  const findLayer = useCallback((cx: number, cy: number): TextLayer | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')!
    for (let i = entry.layers.length - 1; i >= 0; i--) {
      const l = entry.layers[i]
      if (hitTestLayer(ctx, l, cx, cy, canvas.width, canvas.height)) return l
    }
    return null
  }, [entry.layers])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const { cx, cy } = toCanvasCoords(e.clientX, e.clientY)
    const l = findLayer(cx, cy)
    if (!l) return
    onLayerSelect(l.id)
    drag.current = {
      id: l.id,
      ox: cx / (canvasRef.current?.width ?? 1) - l.x,
      oy: cy / (canvasRef.current?.height ?? 1) - l.y,
    }
  }, [toCanvasCoords, findLayer, onLayerSelect])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { cx, cy } = toCanvasCoords(e.clientX, e.clientY)
    if (drag.current) {
      const nx = cx / canvas.width - drag.current.ox
      const ny = cy / canvas.height - drag.current.oy
      onLayerMove(drag.current.id, Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)))
      canvas.style.cursor = 'grabbing'
      return
    }
    const hit = findLayer(cx, cy)
    canvas.style.cursor = hit ? 'grab' : 'default'
  }, [toCanvasCoords, drag, onLayerMove, findLayer])

  const onMouseUp = useCallback(() => {
    drag.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    const { cx, cy } = toCanvasCoords(t.clientX, t.clientY)
    const l = findLayer(cx, cy)
    if (!l) return
    onLayerSelect(l.id)
    drag.current = {
      id: l.id,
      ox: cx / (canvasRef.current?.width ?? 1) - l.x,
      oy: cy / (canvasRef.current?.height ?? 1) - l.y,
    }
  }, [toCanvasCoords, findLayer, onLayerSelect])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (!drag.current || !canvasRef.current) return
    const t = e.touches[0]
    const { cx, cy } = toCanvasCoords(t.clientX, t.clientY)
    const nx = cx / canvasRef.current.width - drag.current.ox
    const ny = cy / canvasRef.current.height - drag.current.oy
    onLayerMove(drag.current.id, Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)))
  }, [toCanvasCoords, drag, onLayerMove])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    />
  )
}
