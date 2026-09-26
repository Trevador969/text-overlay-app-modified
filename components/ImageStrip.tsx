'use client'

import React, {
  useRef,
} from 'react'

import type {
  ImageEntry,
} from '@/lib/types'

import styles from './ImageStrip.module.css'

interface Props {
  images: ImageEntry[]

  activeId:
  | string
  | null

  onSelect: (
    id: string
  ) => void

  onRemove: (
    id: string
  ) => void

  onAdd: (
    files: FileList
  ) => void
}

export default function ImageStrip({
  images,
  activeId,
  onSelect,
  onRemove,
  onAdd,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    )

  const handleDrop = (
    e:
      React.DragEvent
  ) => {
    e.preventDefault()

    if (
      e.dataTransfer
        .files.length
    ) {
      onAdd(
        e.dataTransfer.files
      )
    }
  }

  return (
    <div
      className={
        styles.strip
      }
    >
      {images.map(
        (
          item,
          index
        ) => (
          <div
            key={
              item.id
            }

            className={`
              ${styles.thumb}

              ${item.id ===
                activeId
                ? styles.active
                : ''
              }
            `}

            onClick={() =>
              onSelect(
                item.id
              )
            }
          >
            {item.mediaType ===
              'video' ? (
              <video
                src={
                  item.src
                }

                className={
                  styles.thumbImg
                }

                muted

                playsInline

                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  item.src
                }

                alt={
                  item.name
                }

                className={
                  styles.thumbImg
                }
              />
            )}

            <span
              className={
                styles.thumbIndex
              }
            >
              {index + 1}
            </span>

            {item.mediaType ===
              'video' && (
                <span
                  className={
                    styles.videoBadge
                  }
                >
                  ▶
                </span>
              )}

            <button
              type="button"

              className={
                styles.thumbRemove
              }

              onClick={e => {
                e.stopPropagation()

                onRemove(
                  item.id
                )
              }}

              title="Remover"
            >
              ✕
            </button>

            {item.layers
              .length > 0 && (
                <span
                  className={
                    styles.thumbLayers
                  }
                >
                  {
                    item.layers
                      .length
                  }
                </span>
              )}
          </div>
        )
      )}

      <div
        className={
          styles.addBtn
        }

        onClick={() =>
          inputRef.current
            ?.click()
        }

        onDrop={
          handleDrop
        }

        onDragOver={e =>
          e.preventDefault()
        }

        title="Adicionar imagens ou vídeos"
      >
        <span
          className={
            styles.addIcon
          }
        >
          +
        </span>

        <span
          className={
            styles.addLabel
          }
        >
          Adicionar
        </span>

        <input
          ref={
            inputRef
          }

          type="file"

          accept="image/*,video/mp4,video/webm,video/quicktime"

          multiple

          style={{
            display:
              'none',
          }}

          onChange={e => {
            if (
              e.target.files
            ) {
              onAdd(
                e.target.files
              )
            }

            e.target.value =
              ''
          }}
        />
      </div>
    </div>
  )
}