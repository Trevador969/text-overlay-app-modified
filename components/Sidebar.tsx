'use client'
import React, { useRef } from 'react'
import type { ImageEntry, TextLayer, TextAlign, SnapPosition, ImageAdjust } from '@/lib/types'
import { snapCoords } from '@/lib/canvas'
import { makeLayer, defaultAdjust } from '@/lib/defaults'
import styles from './Sidebar.module.css'

interface Props {
  entry: ImageEntry | null
  onLayerAdd: (layer: TextLayer) => void
  onLayerUpdate: (id: string, patch: Partial<TextLayer>) => void
  onLayerRemove: (id: string) => void
  onLayerSelect: (id: string) => void
  onAdjustUpdate: (patch: Partial<ImageAdjust>) => void
  onAudioFile: (file: File) => void
  onAudioRemove: () => void
  onApplyAudioToAll: () => void
  onExport: () => void
  onExportAll: () => void
  onExportVideo: () => void
  onApplyToAll: () => void
  imageCount: number
}

const FONTS = [
  { label: 'Impact', value: 'Impact' },
  { label: 'Arial Black', value: '"Arial Black", sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
]

const SNAP_GRID: { pos: SnapPosition; icon: string }[][] = [
  [
    { pos: 'top-left', icon: '↖' },
    { pos: 'top-center', icon: '↑' },
    { pos: 'top-right', icon: '↗' },
  ],
  [
    { pos: 'mid-left', icon: '←' },
    { pos: 'mid-center', icon: '✛' },
    { pos: 'mid-right', icon: '→' },
  ],
  [
    { pos: 'bot-left', icon: '↙' },
    { pos: 'bot-center', icon: '↓' },
    { pos: 'bot-right', icon: '↘' },
  ],
]

export default function Sidebar({
  entry, onLayerAdd, onLayerUpdate, onLayerRemove, onLayerSelect,
  onAdjustUpdate, onAudioFile, onAudioRemove, onApplyAudioToAll,
  onExport, onExportAll, onExportVideo, onApplyToAll, imageCount
}: Props) {
  const active = entry?.layers.find(l => l.id === entry.activeLayerId) ?? null
  const audioInputRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<TextLayer>) => {
    if (active) onLayerUpdate(active.id, p)
  }

  const snap = (pos: SnapPosition) => {
    const { x, y } = snapCoords(pos)
    patch({ x, y })
  }

  const adj = entry?.adjust ?? defaultAdjust()

  return (
    <aside className={styles.sidebar}>

      {/* LAYERS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Textos</span>
          <button
            className={styles.addLayerBtn}
            onClick={() => entry && onLayerAdd(makeLayer({ x: 0.5, y: 0.7 }))}
            disabled={!entry}
          >+ Novo</button>
        </div>

        {!entry && <p className={styles.empty}>Selecione uma imagem</p>}
        {entry && entry.layers.length === 0 && <p className={styles.empty}>Nenhum texto ainda</p>}

        <div className={styles.layerList}>
          {entry?.layers.map((l, i) => (
            <div
              key={l.id}
              className={`${styles.layerCard} ${l.id === entry.activeLayerId ? styles.layerActive : ''}`}
              onClick={() => onLayerSelect(l.id)}
            >
              <div className={styles.layerCardTop}>
                <span className={styles.layerBadge}>T{i + 1}</span>
                <button className={styles.layerDel} onClick={e => { e.stopPropagation(); onLayerRemove(l.id) }}>✕</button>
              </div>
              <textarea
                className={styles.layerTextarea}
                value={l.text}
                rows={2}
                onChange={e => onLayerUpdate(l.id, { text: e.target.value })}
                onClick={e => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </section>

      {/* STYLE CONTROLS */}
      {active && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>Estilo do Texto</span>
          </div>
          <div className={styles.controls}>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Fonte</span>
              <select className={styles.select} value={active.fontFamily} onChange={e => patch({ fontFamily: e.target.value })}>
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Tamanho</span>
              <input type="range" className={styles.range} min={10} max={150} value={active.fontSize} onChange={e => patch({ fontSize: +e.target.value })} />
              <span className={styles.val}>{active.fontSize}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Peso</span>
              <div className={styles.toggleGroup}>
                {(['normal', 'bold'] as const).map(w => (
                  <button key={w} className={`${styles.toggleBtn} ${active.fontWeight === w ? styles.toggleOn : ''}`} onClick={() => patch({ fontWeight: w })}>
                    {w === 'normal' ? 'Normal' : 'Bold'}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Cor texto</span>
              <input type="color" className={styles.colorInput} value={active.color} onChange={e => patch({ color: e.target.value })} />
              <span className={styles.ctrlLabel} style={{ marginLeft: 8 }}>Sombra</span>
              <input type="color" className={styles.colorInput} value={active.shadowColor} onChange={e => patch({ shadowColor: e.target.value })} />
            </div>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Alinha</span>
              <div className={styles.toggleGroup}>
                {(['left', 'center', 'right'] as TextAlign[]).map(a => (
                  <button key={a} className={`${styles.toggleBtn} ${active.align === a ? styles.toggleOn : ''}`} onClick={() => patch({ align: a })}>
                    {a === 'left' ? '◀' : a === 'center' ? '▮' : '▶'}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Opacidade</span>
              <input type="range" className={styles.range} min={0} max={1} step={0.05} value={active.opacity} onChange={e => patch({ opacity: +e.target.value })} />
              <span className={styles.val}>{Math.round(active.opacity * 100)}%</span>
            </div>
            <div className={styles.row}>
              <span className={styles.ctrlLabel}>Borda</span>
              <input type="range" className={styles.range} min={0} max={8} step={0.5} value={active.strokeWidth} onChange={e => patch({ strokeWidth: +e.target.value })} />
              <span className={styles.val}>{active.strokeWidth}</span>
            </div>
            <div className={styles.row}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={active.shadow} onChange={e => patch({ shadow: e.target.checked })} className={styles.checkbox} />
                Sombra difusa
              </label>
            </div>

            <div className={styles.snapSection}>
              <span className={styles.snapTitle}>Posição rápida</span>
              <div className={styles.snapGrid}>
                {SNAP_GRID.map((row, ri) => (
                  <div key={ri} className={styles.snapRow}>
                    {row.map(({ pos, icon }) => (
                      <button key={pos} className={styles.snapBtn} onClick={() => snap(pos)}>{icon}</button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* IMAGE ADJUSTMENTS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Editar Imagem</span>
          {entry && (
            <button className={styles.resetBtn} onClick={() => onAdjustUpdate(defaultAdjust())}>
              ↺ Reset
            </button>
          )}
        </div>
        <div className={styles.controls}>
          <div className={styles.row}>
            <span className={styles.ctrlLabel}>Opacidade</span>
            <input type="range" className={styles.range} min={0} max={1} step={0.01} value={adj.opacity} disabled={!entry}
              onChange={e => onAdjustUpdate({ opacity: +e.target.value })} />
            <span className={styles.val}>{Math.round(adj.opacity * 100)}%</span>
          </div>
          <div className={styles.row}>
            <span className={styles.ctrlLabel}>Brilho</span>
            <input type="range" className={styles.range} min={0} max={200} value={adj.brightness} disabled={!entry}
              onChange={e => onAdjustUpdate({ brightness: +e.target.value })} />
            <span className={styles.val}>{adj.brightness}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.ctrlLabel}>Contraste</span>
            <input type="range" className={styles.range} min={0} max={200} value={adj.contrast} disabled={!entry}
              onChange={e => onAdjustUpdate({ contrast: +e.target.value })} />
            <span className={styles.val}>{adj.contrast}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.ctrlLabel}>Saturação</span>
            <input type="range" className={styles.range} min={0} max={200} value={adj.saturate} disabled={!entry}
              onChange={e => onAdjustUpdate({ saturate: +e.target.value })} />
            <span className={styles.val}>{adj.saturate}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.ctrlLabel}>Blur</span>
            <input type="range" className={styles.range} min={0} max={10} step={0.5} value={adj.blur} disabled={!entry}
              onChange={e => onAdjustUpdate({ blur: +e.target.value })} />
            <span className={styles.val}>{adj.blur}px</span>
          </div>
        </div>
      </section>

      {/* AUDIO */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Áudio</span>
          {entry?.audioSrc && imageCount > 1 && (
            <button className={styles.applyAudioBtn} onClick={onApplyAudioToAll} title="Aplicar áudio em todas">
              ✦ Todas
            </button>
          )}
        </div>

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) onAudioFile(f)
            e.target.value = ''
          }}
        />

        {entry?.audioSrc ? (
          <div className={styles.audioCard}>
            <div className={styles.audioInfo}>
              <span className={styles.audioIcon}>🎵</span>
              <span className={styles.audioName}>{entry.audioName ?? 'Áudio'}</span>
            </div>
            <div className={styles.audioActions}>
              <button className={styles.audioChange} onClick={() => audioInputRef.current?.click()}>Trocar</button>
              <button className={styles.audioDel} onClick={onAudioRemove}>✕</button>
            </div>
          </div>
        ) : (
          <button
            className={styles.audioUploadBtn}
            onClick={() => audioInputRef.current?.click()}
            disabled={!entry}
          >
            + Adicionar áudio
          </button>
        )}

        {entry?.audioSrc && (
          <p className={styles.audioHint}>O vídeo terá a duração do áudio</p>
        )}
      </section>

      {/* EXPORT */}
      <section className={styles.exportSection}>
        {imageCount > 1 && entry && entry.layers.length > 0 && (
          <button className={styles.applyAllBtn} onClick={onApplyToAll}>
            ✦ Aplicar texto em todas ({imageCount})
          </button>
        )}
        <button className={styles.exportBtn} onClick={onExport} disabled={!entry}>
          ⬇ Baixar imagem
        </button>
        <button
          className={styles.exportVideoBtn}
          onClick={onExportVideo}
          disabled={!entry}
        >
          ▶ Exportar como vídeo
        </button>
        {imageCount > 1 && (
          <button className={styles.exportAllBtn} onClick={onExportAll}>
            ⬇ Baixar todas ({imageCount})
          </button>
        )}
      </section>

    </aside>
  )
}
