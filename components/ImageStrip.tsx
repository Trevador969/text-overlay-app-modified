'use client'
import React, { useRef } from 'react'
import type { ImageEntry } from '@/lib/types'
import styles from './ImageStrip.module.css'

interface Props {
  images: ImageEntry[]
  activeId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (files: FileList) => void
}

export default function ImageStrip({ images, activeId, onSelect, onRemove, onAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files)
  }

  return (
    <div className={styles.strip}>
      {images.map((img, i) => (
        <div
          key={img.id}
          className={`${styles.thumb} ${img.id === activeId ? styles.active : ''}`}
          onClick={() => onSelect(img.id)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} alt={img.name} className={styles.thumbImg} />
          <span className={styles.thumbIndex}>{i + 1}</span>
          <button
            className={styles.thumbRemove}
            onClick={e => { e.stopPropagation(); onRemove(img.id) }}
            title="Remover"
          >✕</button>
          {img.layers.length > 0 && (
            <span className={styles.thumbLayers}>{img.layers.length}</span>
          )}
        </div>
      ))}

      <div
        className={styles.addBtn}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        title="Adicionar imagens"
      >
        <span className={styles.addIcon}>+</span>
        <span className={styles.addLabel}>Adicionar</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && onAdd(e.target.files)}
        />
      </div>
    </div>
  )
}
