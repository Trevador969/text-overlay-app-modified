'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { ImageEntry, TextLayer, ImageAdjust } from '@/lib/types'
import { makeLayer, makeImageId, defaultAdjust } from '@/lib/defaults'
import { exportCanvas } from '@/lib/canvas'
import ImageStrip from '@/components/ImageStrip'
import CanvasEditor from '@/components/CanvasEditor'
import Sidebar from '@/components/Sidebar'
import DropZone from '@/components/DropZone'
import styles from './page.module.css'

const imgElements = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const el = new Image()
    el.onload = () => res(el)
    el.onerror = rej
    el.src = src
  })
}

export default function Home() {
  const [images, setImages] = useState<ImageEntry[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)

  const activeEntry = images.find(i => i.id === activeImageId) ?? null
  const activeImgEl = activeImageId ? (imgElements.get(activeImageId) ?? null) : null

  // ── ADD IMAGES ────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return

    const newEntries: ImageEntry[] = []
    for (const file of arr) {
      const src = await new Promise<string>(res => {
        const r = new FileReader()
        r.onload = e => res(e.target!.result as string)
        r.readAsDataURL(file)
      })
      const el = await loadImage(src)
      const id = makeImageId()
      imgElements.set(id, el)
      newEntries.push({
        id,
        name: file.name,
        src,
        width: el.naturalWidth,
        height: el.naturalHeight,
        layers: [makeLayer({ x: 0.5, y: 0.72 })],
        activeLayerId: null,
        adjust: defaultAdjust(),
        audioSrc: null,
        audioName: null,
      })
    }

    setImages(prev => {
      const next = [...prev, ...newEntries]
      return next
    })
    setActiveImageId(newEntries[0].id)
  }, [])

  // ── REMOVE IMAGE ──────────────────────────────────────────────────────
  const handleRemoveImage = useCallback((id: string) => {
    imgElements.delete(id)
    setImages(prev => {
      const next = prev.filter(i => i.id !== id)
      if (activeImageId === id) {
        setActiveImageId(next.length ? next[next.length - 1].id : null)
      }
      return next
    })
  }, [activeImageId])

  // ── UPDATE IMAGE ENTRY ────────────────────────────────────────────────
  const updateEntry = useCallback((id: string, fn: (e: ImageEntry) => ImageEntry) => {
    setImages(prev => prev.map(img => img.id === id ? fn(img) : img))
  }, [])

  // ── LAYER OPS ─────────────────────────────────────────────────────────
  const addLayer = useCallback((layer: TextLayer) => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => ({
      ...e,
      layers: [...e.layers, layer],
      activeLayerId: layer.id,
    }))
  }, [activeImageId, updateEntry])

  const updateLayer = useCallback((layerId: string, patch: Partial<TextLayer>) => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => ({
      ...e,
      layers: e.layers.map(l => l.id === layerId ? { ...l, ...patch } : l),
    }))
  }, [activeImageId, updateEntry])

  const removeLayer = useCallback((layerId: string) => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => {
      const layers = e.layers.filter(l => l.id !== layerId)
      return {
        ...e,
        layers,
        activeLayerId: layers.length ? layers[layers.length - 1].id : null,
      }
    })
  }, [activeImageId, updateEntry])

  const selectLayer = useCallback((layerId: string) => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => ({ ...e, activeLayerId: layerId }))
  }, [activeImageId, updateEntry])

  const moveLayer = useCallback((layerId: string, x: number, y: number) => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => ({
      ...e,
      layers: e.layers.map(l => l.id === layerId ? { ...l, x, y } : l),
    }))
  }, [activeImageId, updateEntry])

  // ── IMAGE ADJUST ──────────────────────────────────────────────────────
  const updateAdjust = useCallback((patch: Partial<ImageAdjust>) => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => ({ ...e, adjust: { ...e.adjust, ...patch } }))
  }, [activeImageId, updateEntry])

  // ── AUDIO ─────────────────────────────────────────────────────────────
  const handleAudioFile = useCallback((file: File) => {
    if (!activeImageId) return
    const r = new FileReader()
    r.onload = e => {
      const src = e.target!.result as string
      updateEntry(activeImageId, entry => ({
        ...entry,
        audioSrc: src,
        audioName: file.name,
      }))
    }
    r.readAsDataURL(file)
  }, [activeImageId, updateEntry])

  const handleRemoveAudio = useCallback(() => {
    if (!activeImageId) return
    updateEntry(activeImageId, e => ({ ...e, audioSrc: null, audioName: null }))
  }, [activeImageId, updateEntry])

  const handleApplyAudioToAll = useCallback(() => {
    if (!activeEntry || !activeEntry.audioSrc) return
    const { audioSrc, audioName } = activeEntry
    setImages(prev => prev.map(img =>
      img.id === activeEntry.id ? img : { ...img, audioSrc, audioName }
    ))
  }, [activeEntry])

  // ── APPLY LAYERS TO ALL ───────────────────────────────────────────────
  const handleApplyToAll = useCallback(() => {
    if (!activeEntry || images.length <= 1) return
    const sourceLayers = activeEntry.layers
    setImages(prev => prev.map(img => {
      if (img.id === activeEntry.id) return img
      const newLayers = sourceLayers.map(l => ({
        ...l,
        id: `layer-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      }))
      return {
        ...img,
        layers: newLayers,
        activeLayerId: newLayers.length ? newLayers[0].id : null,
      }
    }))
  }, [activeEntry, images.length])

  // ── EXPORT IMAGE ──────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!activeEntry) return
    const el = imgElements.get(activeEntry.id)
    if (!el) return
    const url = exportCanvas(el, activeEntry.layers, activeEntry.adjust)
    const a = document.createElement('a')
    a.download = `overlay_${activeEntry.name.replace(/\.[^.]+$/, '')}.png`
    a.href = url
    a.click()
  }, [activeEntry])

  const handleExportAll = useCallback(() => {
    images.forEach(entry => {
      const el = imgElements.get(entry.id)
      if (!el) return
      const url = exportCanvas(el, entry.layers, entry.adjust)
      const a = document.createElement('a')
      a.download = `overlay_${entry.name.replace(/\.[^.]+$/, '')}.png`
      a.href = url
      setTimeout(() => a.click(), 0)
    })
  }, [images])

  // ── EXPORT VIDEO ──────────────────────────────────────────────────────
  const handleExportVideo = useCallback(async (entry: ImageEntry) => {
    const el = imgElements.get(entry.id)
    if (!el) return

    const VIDEO_DURATION = 5 // sempre 5 segundos

    const canvas = document.createElement('canvas')
    canvas.width = el.naturalWidth
    canvas.height = el.naturalHeight
    const ctx = canvas.getContext('2d')!

    // Apply adjustments + draw image + layers once (static frame)
    const { buildFilter } = await import('@/lib/canvas')
    ctx.filter = buildFilter(entry.adjust)
    ctx.globalAlpha = entry.adjust.opacity
    ctx.drawImage(el, 0, 0)
    ctx.filter = 'none'
    ctx.globalAlpha = 1
    const { drawLayer } = await import('@/lib/canvas')
    entry.layers.forEach(l => drawLayer(ctx, l, canvas.width, canvas.height))

    const canvasStream = canvas.captureStream(25)

    let audioTrack: MediaStreamTrack | null = null

    if (entry.audioSrc) {
      try {
        const audioCtx = new AudioContext()
        const res = await fetch(entry.audioSrc)
        const buf = await res.arrayBuffer()
        const decoded = await audioCtx.decodeAudioData(buf)

        const dest = audioCtx.createMediaStreamDestination()
        const source = audioCtx.createBufferSource()
        source.buffer = decoded
        source.connect(dest)
        source.start()
        audioTrack = dest.stream.getAudioTracks()[0]
      } catch (e) {
        console.warn('Audio processing failed', e)
      }
    }

    const tracks: MediaStreamTrack[] = [...canvasStream.getTracks()]
    if (audioTrack) tracks.push(audioTrack)
    const stream = new MediaStream(tracks)

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = `video_${entry.name.replace(/\.[^.]+$/, '')}.webm`
      a.href = url
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    }

    recorder.start()
    setTimeout(() => recorder.stop(), VIDEO_DURATION * 1000) // sempre 5s
  }, [])

  // ── GLOBAL PASTE ──────────────────────────────────────────────────────
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItems = items.filter(i => i.type.startsWith('image/'))
      if (!imageItems.length) return
      const files = imageItems.map(i => i.getAsFile()).filter(Boolean) as File[]
      const dt = new DataTransfer()
      files.forEach(f => dt.items.add(f))
      if (dt.files.length) handleFiles(dt.files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFiles])

  const handleAreaDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const isEmpty = images.length === 0

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎬</span>
          <span className={styles.logoText}>TextOverlay</span>
        </div>
        <span className={styles.headerSub}>
          {isEmpty ? 'Faça upload de imagens para começar' : `${images.length} imagem${images.length > 1 ? 's' : ''} carregada${images.length > 1 ? 's' : ''}`}
        </span>
      </header>

      <div className={styles.body}>
        <Sidebar
          entry={activeEntry}
          onLayerAdd={addLayer}
          onLayerUpdate={updateLayer}
          onLayerRemove={removeLayer}
          onLayerSelect={selectLayer}
          onAdjustUpdate={updateAdjust}
          onAudioFile={handleAudioFile}
          onAudioRemove={handleRemoveAudio}
          onApplyAudioToAll={handleApplyAudioToAll}
          onExport={handleExport}
          onExportAll={handleExportAll}
          onExportVideo={() => activeEntry && handleExportVideo(activeEntry)}
          onApplyToAll={handleApplyToAll}
          imageCount={images.length}
        />

        <main className={styles.main}>
          {images.length > 0 && (
            <ImageStrip
              images={images}
              activeId={activeImageId}
              onSelect={setActiveImageId}
              onRemove={handleRemoveImage}
              onAdd={handleFiles}
            />
          )}

          <div
            className={styles.canvasArea}
            onDrop={handleAreaDrop}
            onDragOver={e => e.preventDefault()}
          >
            {isEmpty ? (
              <DropZone onFiles={handleFiles} />
            ) : activeEntry && activeImgEl ? (
              <CanvasEditor
                key={activeEntry.id}
                entry={activeEntry}
                imgEl={activeImgEl}
                onLayerMove={moveLayer}
                onLayerSelect={selectLayer}
              />
            ) : (
              <div className={styles.noSelection}>
                <span>Selecione uma imagem acima</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}