'use client'

import React, {
  useRef,
} from 'react'

import type {
  ImageEntry,
  TextLayer,
  TextAlign,
  SnapPosition,
  ImageAdjust,
} from '@/lib/types'

import {
  snapCoords,
} from '@/lib/canvas'

import {
  makeLayer,
  defaultAdjust,
} from '@/lib/defaults'

import styles from './Sidebar.module.css'

interface Props {
  muteAllVideos: boolean
  onMuteAllVideosChange: (muted: boolean) => void

  entry:
  | ImageEntry
  | null

  onLayerAdd: (
    layer: TextLayer
  ) => void

  onLayerUpdate: (
    id: string,
    patch:
      Partial<TextLayer>
  ) => void

  onLayerRemove: (
    id: string
  ) => void

  onLayerSelect: (
    id: string
  ) => void

  onAdjustUpdate: (
    patch:
      Partial<ImageAdjust>
  ) => void

  onAudioFile: (
    file: File
  ) => void

  onAudioRemove:
  () => void

  onApplyAudioToAll:
  () => void

  onExport:
  () => void

  onExportAll:
  () => void

  onExportVideo:
  () => void

  onApplyToAll:
  () => void

  imageCount:
  number
}

const FONTS = [
  {
    label:
      'Impact',

    value:
      'Impact',
  },

  {
    label:
      'Arial Black',

    value:
      '"Arial Black", sans-serif',
  },

  {
    label:
      'Segoe UI',

    value:
      '"Segoe UI", sans-serif',
  },

  {
    label:
      'Georgia',

    value:
      'Georgia, serif',
  },

  {
    label:
      'Courier New',

    value:
      '"Courier New", monospace',
  },
]

const SNAP_GRID: {
  pos: SnapPosition
  icon: string
}[][] = [
    [
      {
        pos:
          'top-left',

        icon:
          '↖',
      },

      {
        pos:
          'top-center',

        icon:
          '↑',
      },

      {
        pos:
          'top-right',

        icon:
          '↗',
      },
    ],

    [
      {
        pos:
          'mid-left',

        icon:
          '←',
      },

      {
        pos:
          'mid-center',

        icon:
          '✛',
      },

      {
        pos:
          'mid-right',

        icon:
          '→',
      },
    ],

    [
      {
        pos:
          'bot-left',

        icon:
          '↙',
      },

      {
        pos:
          'bot-center',

        icon:
          '↓',
      },

      {
        pos:
          'bot-right',

        icon:
          '↘',
      },
    ],
  ]

export default function Sidebar({
  muteAllVideos,
  onMuteAllVideosChange,

  entry,

  onLayerAdd,

  onLayerUpdate,

  onLayerRemove,

  onLayerSelect,

  onAdjustUpdate,

  onAudioFile,

  onAudioRemove,

  onApplyAudioToAll,

  onExport,

  onExportAll,

  onExportVideo,

  onApplyToAll,

  imageCount,
}: Props) {
  const active =
    entry?.layers.find(
      layer =>
        layer.id ===
        entry.activeLayerId
    ) ?? null

  const audioInputRef =
    useRef<HTMLInputElement>(
      null
    )

  const patch = (
    value:
      Partial<TextLayer>
  ) => {
    if (active) {
      onLayerUpdate(
        active.id,
        value
      )
    }
  }

  const snap = (
    pos:
      SnapPosition
  ) => {
    const {
      x,
      y,
    } =
      snapCoords(
        pos
      )

    patch({
      x,
      y,
    })
  }

  const adj =
    entry?.adjust ??
    defaultAdjust()

  return (
    <aside
      className={
        styles.sidebar
      }
    >
      <section className={styles.section} aria-labelledby="video-audio-heading">
        <div className={styles.sectionHeader}>
          <h2 id="video-audio-heading" className={styles.label}>Som dos vídeos</h2>
          <span className={styles.audioScope}>Todos</span>
        </div>
        <label className={styles.muteControl}>
          <input
            type="checkbox"
            role="switch"
            className={styles.muteSwitch}
            checked={muteAllVideos}
            onChange={event => onMuteAllVideosChange(event.target.checked)}
            aria-describedby="mute-videos-hint"
          />
          <span>Retirar som de todos os vídeos</span>
        </label>
        <p id="mute-videos-hint" className={styles.audioHint} role="status">
          {muteAllVideos
            ? 'Ativado: todos os vídeos serão exportados sem som, incluindo áudio extra e novos arquivos.'
            : 'Ative para exportar todos os vídeos sem áudio original ou adicionado.'}
        </p>
      </section>

      {/*
      ========================================================
      TEXTOS
      ========================================================
      */}

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span
            className={
              styles.label
            }
          >
            Textos
          </span>

          <button
            type="button"

            className={
              styles.addLayerBtn
            }

            onClick={() => {
              if (!entry) {
                return
              }

              onLayerAdd(
                makeLayer({
                  x: 0.5,
                  y: 0.7,
                })
              )
            }}

            disabled={
              !entry
            }
          >
            + Novo
          </button>
        </div>

        {!entry && (
          <p
            className={
              styles.empty
            }
          >
            Selecione uma mídia
          </p>
        )}

        {entry &&
          entry.layers.length ===
          0 && (
            <p
              className={
                styles.empty
              }
            >
              Nenhum texto ainda
            </p>
          )}

        <div
          className={
            styles.layerList
          }
        >
          {entry?.layers.map(
            (
              layer,
              index
            ) => (
              <div
                key={
                  layer.id
                }

                className={`
                  ${styles.layerCard}

                  ${layer.id ===
                    entry.activeLayerId
                    ? styles.layerActive
                    : ''
                  }
                `}

                onClick={() =>
                  onLayerSelect(
                    layer.id
                  )
                }
              >
                <div
                  className={
                    styles.layerCardTop
                  }
                >
                  <span
                    className={
                      styles.layerBadge
                    }
                  >
                    T
                    {index +
                      1}
                  </span>

                  <button
                    type="button"

                    className={
                      styles.layerDel
                    }

                    onClick={e => {
                      e.stopPropagation()

                      onLayerRemove(
                        layer.id
                      )
                    }}
                  >
                    ✕
                  </button>
                </div>

                <textarea
                  className={
                    styles.layerTextarea
                  }

                  value={
                    layer.text
                  }

                  rows={
                    2
                  }

                  onChange={e =>
                    onLayerUpdate(
                      layer.id,
                      {
                        text:
                          e.target
                            .value,
                      }
                    )
                  }

                  onClick={e =>
                    e.stopPropagation()
                  }
                />
              </div>
            )
          )}
        </div>
      </section>

      {/*
      ========================================================
      ESTILO DO TEXTO
      ========================================================
      */}

      {active && (
        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <span
              className={
                styles.label
              }
            >
              Estilo do Texto
            </span>
          </div>

          <div
            className={
              styles.controls
            }
          >
            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Fonte
              </span>

              <select
                className={
                  styles.select
                }

                value={
                  active.fontFamily
                }

                onChange={e =>
                  patch({
                    fontFamily:
                      e.target
                        .value,
                  })
                }
              >
                {FONTS.map(
                  font => (
                    <option
                      key={
                        font.value
                      }

                      value={
                        font.value
                      }
                    >
                      {
                        font.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Tamanho
              </span>

              <input
                type="range"

                className={
                  styles.range
                }

                min={
                  10
                }

                max={
                  150
                }

                value={
                  active.fontSize
                }

                onChange={e =>
                  patch({
                    fontSize:
                      Number(
                        e.target
                          .value
                      ),
                  })
                }
              />

              <span
                className={
                  styles.val
                }
              >
                {
                  active.fontSize
                }
              </span>
            </div>

            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Peso
              </span>

              <div
                className={
                  styles.toggleGroup
                }
              >
                {(
                  [
                    'normal',
                    'bold',
                  ] as const
                ).map(
                  weight => (
                    <button
                      type="button"

                      key={
                        weight
                      }

                      className={`
                        ${styles.toggleBtn}

                        ${active.fontWeight ===
                          weight
                          ? styles.toggleOn
                          : ''
                        }
                      `}

                      onClick={() =>
                        patch({
                          fontWeight:
                            weight,
                        })
                      }
                    >
                      {weight ===
                        'normal'
                        ? 'Normal'
                        : 'Bold'}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Cor texto
              </span>

              <input
                type="color"

                className={
                  styles.colorInput
                }

                value={
                  active.color
                }

                onChange={e =>
                  patch({
                    color:
                      e.target
                        .value,
                  })
                }
              />

              <span
                className={
                  styles.ctrlLabel
                }

                style={{
                  marginLeft:
                    8,
                }}
              >
                Sombra
              </span>

              <input
                type="color"

                className={
                  styles.colorInput
                }

                value={
                  active.shadowColor
                }

                onChange={e =>
                  patch({
                    shadowColor:
                      e.target
                        .value,
                  })
                }
              />
            </div>

            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Alinha
              </span>

              <div
                className={
                  styles.toggleGroup
                }
              >
                {(
                  [
                    'left',
                    'center',
                    'right',
                  ] as TextAlign[]
                ).map(
                  align => (
                    <button
                      type="button"

                      key={
                        align
                      }

                      className={`
                        ${styles.toggleBtn}

                        ${active.align ===
                          align
                          ? styles.toggleOn
                          : ''
                        }
                      `}

                      onClick={() =>
                        patch({
                          align,
                        })
                      }
                    >
                      {align ===
                        'left'
                        ? '◀'
                        : align ===
                          'center'
                          ? '▮'
                          : '▶'}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Opacidade
              </span>

              <input
                type="range"

                className={
                  styles.range
                }

                min={
                  0
                }

                max={
                  1
                }

                step={
                  0.05
                }

                value={
                  active.opacity
                }

                onChange={e =>
                  patch({
                    opacity:
                      Number(
                        e.target
                          .value
                      ),
                  })
                }
              />

              <span
                className={
                  styles.val
                }
              >
                {Math.round(
                  active.opacity *
                  100
                )}
                %
              </span>
            </div>

            <div
              className={
                styles.row
              }
            >
              <span
                className={
                  styles.ctrlLabel
                }
              >
                Borda
              </span>

              <input
                type="range"

                className={
                  styles.range
                }

                min={
                  0
                }

                max={
                  8
                }

                step={
                  0.5
                }

                value={
                  active.strokeWidth
                }

                onChange={e =>
                  patch({
                    strokeWidth:
                      Number(
                        e.target
                          .value
                      ),
                  })
                }
              />

              <span
                className={
                  styles.val
                }
              >
                {
                  active.strokeWidth
                }
              </span>
            </div>

            <div
              className={
                styles.row
              }
            >
              <label
                className={
                  styles.checkLabel
                }
              >
                <input
                  type="checkbox"

                  checked={
                    active.shadow
                  }

                  onChange={e =>
                    patch({
                      shadow:
                        e.target
                          .checked,
                    })
                  }

                  className={
                    styles.checkbox
                  }
                />

                Sombra difusa
              </label>
            </div>

            <div
              className={
                styles.snapSection
              }
            >
              <span
                className={
                  styles.snapTitle
                }
              >
                Posição rápida
              </span>

              <div
                className={
                  styles.snapGrid
                }
              >
                {SNAP_GRID.map(
                  (
                    row,
                    rowIndex
                  ) => (
                    <div
                      key={
                        rowIndex
                      }

                      className={
                        styles.snapRow
                      }
                    >
                      {row.map(
                        ({
                          pos,
                          icon,
                        }) => (
                          <button
                            type="button"

                            key={
                              pos
                            }

                            className={
                              styles.snapBtn
                            }

                            onClick={() =>
                              snap(
                                pos
                              )
                            }
                          >
                            {
                              icon
                            }
                          </button>
                        )
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/*
      ========================================================
      AJUSTES DE MÍDIA
      ========================================================
      */}

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span
            className={
              styles.label
            }
          >
            Editar Mídia
          </span>

          {entry && (
            <button
              type="button"

              className={
                styles.resetBtn
              }

              onClick={() =>
                onAdjustUpdate(
                  defaultAdjust()
                )
              }
            >
              ↺ Reset
            </button>
          )}
        </div>

        <div
          className={
            styles.controls
          }
        >
          <div
            className={
              styles.row
            }
          >
            <span
              className={
                styles.ctrlLabel
              }
            >
              Opacidade
            </span>

            <input
              type="range"

              className={
                styles.range
              }

              min={
                0
              }

              max={
                1
              }

              step={
                0.01
              }

              value={
                adj.opacity
              }

              disabled={
                !entry
              }

              onChange={e =>
                onAdjustUpdate({
                  opacity:
                    Number(
                      e.target
                        .value
                    ),
                })
              }
            />

            <span
              className={
                styles.val
              }
            >
              {Math.round(
                adj.opacity *
                100
              )}
              %
            </span>
          </div>

          <div
            className={
              styles.row
            }
          >
            <span
              className={
                styles.ctrlLabel
              }
            >
              Brilho
            </span>

            <input
              type="range"

              className={
                styles.range
              }

              min={
                0
              }

              max={
                200
              }

              value={
                adj.brightness
              }

              disabled={
                !entry
              }

              onChange={e =>
                onAdjustUpdate({
                  brightness:
                    Number(
                      e.target
                        .value
                    ),
                })
              }
            />

            <span
              className={
                styles.val
              }
            >
              {
                adj.brightness
              }
            </span>
          </div>

          <div
            className={
              styles.row
            }
          >
            <span
              className={
                styles.ctrlLabel
              }
            >
              Contraste
            </span>

            <input
              type="range"

              className={
                styles.range
              }

              min={
                0
              }

              max={
                200
              }

              value={
                adj.contrast
              }

              disabled={
                !entry
              }

              onChange={e =>
                onAdjustUpdate({
                  contrast:
                    Number(
                      e.target
                        .value
                    ),
                })
              }
            />

            <span
              className={
                styles.val
              }
            >
              {
                adj.contrast
              }
            </span>
          </div>

          <div
            className={
              styles.row
            }
          >
            <span
              className={
                styles.ctrlLabel
              }
            >
              Saturação
            </span>

            <input
              type="range"

              className={
                styles.range
              }

              min={
                0
              }

              max={
                200
              }

              value={
                adj.saturate
              }

              disabled={
                !entry
              }

              onChange={e =>
                onAdjustUpdate({
                  saturate:
                    Number(
                      e.target
                        .value
                    ),
                })
              }
            />

            <span
              className={
                styles.val
              }
            >
              {
                adj.saturate
              }
            </span>
          </div>

          <div
            className={
              styles.row
            }
          >
            <span
              className={
                styles.ctrlLabel
              }
            >
              Blur
            </span>

            <input
              type="range"

              className={
                styles.range
              }

              min={
                0
              }

              max={
                10
              }

              step={
                0.5
              }

              value={
                adj.blur
              }

              disabled={
                !entry
              }

              onChange={e =>
                onAdjustUpdate({
                  blur:
                    Number(
                      e.target
                        .value
                    ),
                })
              }
            />

            <span
              className={
                styles.val
              }
            >
              {
                adj.blur
              }
              px
            </span>
          </div>
        </div>
      </section>

      {/*
      ========================================================
      ÁUDIO EXTRA
      ========================================================
      */}

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span
            className={
              styles.label
            }
          >
            Áudio extra
          </span>

          {entry?.audioSrc &&
            imageCount >
            1 && (
              <button
                type="button"

                className={
                  styles.applyAudioBtn
                }

                onClick={
                  onApplyAudioToAll
                }
              >
                ✦ Todas
              </button>
            )}
        </div>

        <input
          ref={
            audioInputRef
          }

          type="file"

          accept="audio/*"

          style={{
            display:
              'none',
          }}

          onChange={e => {
            const file =
              e.target.files
              ?.[0]

            if (file) {
              onAudioFile(
                file
              )
            }

            e.target.value =
              ''
          }}
        />

        {entry?.audioSrc ? (
          <div
            className={
              styles.audioCard
            }
          >
            <div
              className={
                styles.audioInfo
              }
            >
              <span
                className={
                  styles.audioIcon
                }
              >
                🎵
              </span>

              <span
                className={
                  styles.audioName
                }
              >
                {entry.audioName ??
                  'Áudio'}
              </span>
            </div>

            <div
              className={
                styles.audioActions
              }
            >
              <button
                type="button"

                className={
                  styles.audioChange
                }

                onClick={() =>
                  audioInputRef
                    .current
                    ?.click()
                }
              >
                Trocar
              </button>

              <button
                type="button"

                className={
                  styles.audioDel
                }

                onClick={
                  onAudioRemove
                }
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"

            className={
              styles.audioUploadBtn
            }

            onClick={() =>
              audioInputRef
                .current
                ?.click()
            }

            disabled={
              !entry
            }
          >
            + Adicionar áudio
          </button>
        )}

        {entry?.audioSrc && (
          <p
            className={
              styles.audioHint
            }
          >
            {muteAllVideos
              ? 'Áudio extra salvo, mas não será incluído enquanto a opção de retirar som estiver ativada.'
              : 'Áudio extra aplicado à mídia atual.'}
          </p>
        )}
      </section>

      {/*
      ========================================================
      EXPORT
      ========================================================
      */}

      <section
        className={
          styles.exportSection
        }
      >
        {imageCount >
          1 &&
          entry &&
          entry.layers
            .length >
          0 && (
            <button
              type="button"

              className={
                styles.applyAllBtn
              }

              onClick={
                onApplyToAll
              }
            >
              ✦ Aplicar texto
              em todas (
              {imageCount})
            </button>
          )}

        <button
          type="button"

          className={
            styles.exportBtn
          }

          onClick={
            onExport
          }

          disabled={
            !entry ||
            entry.mediaType !==
            'image'
          }
        >
          ⬇ Baixar imagem
        </button>

        <button
          type="button"

          className={
            styles.exportVideoBtn
          }

          onClick={
            onExportVideo
          }

          disabled={
            !entry
          }
        >
          ▶ Exportar como
          vídeo
        </button>

        {imageCount >
          1 && (
            <button
              type="button"

              className={
                styles.exportAllBtn
              }

              onClick={
                onExportAll
              }
            >
              ⬇ Baixar todas
              as imagens
            </button>
          )}
      </section>
    </aside>
  )
}
