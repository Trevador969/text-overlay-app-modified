'use client'

import React, {
  useRef,
} from 'react'

import styles from './DropZone.module.css'

interface Props {
  onFiles: (
    files: FileList
  ) => void
}

export default function DropZone({
  onFiles,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    )

  const [
    dragging,
    setDragging,
  ] =
    React.useState(
      false
    )

  const handleDrop = (
    e:
      React.DragEvent
  ) => {
    e.preventDefault()

    setDragging(
      false
    )

    if (
      e.dataTransfer
        .files.length
    ) {
      onFiles(
        e.dataTransfer.files
      )
    }
  }

  return (
    <div
      className={`
        ${styles.zone}
        ${dragging
          ? styles.over
          : ''
        }
      `}

      onClick={() =>
        inputRef.current
          ?.click()
      }

      onDrop={
        handleDrop
      }

      onDragOver={e => {
        e.preventDefault()

        setDragging(
          true
        )
      }}

      onDragLeave={() =>
        setDragging(
          false
        )
      }
    >
      <div
        className={
          styles.icon
        }
      >
        🎬
      </div>

      <p
        className={
          styles.title
        }
      >
        Arraste imagens
        ou vídeos aqui
      </p>

      <p
        className={
          styles.sub
        }
      >
        ou clique para
        selecionar —{' '}

        <strong>
          múltiplos arquivos
        </strong>{' '}

        de uma vez
      </p>

      <div
        className={
          styles.hint
        }
      >
        JPG · PNG · WEBP · GIF
        · MP4 · WEBM · MOV
      </div>

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
            onFiles(
              e.target.files
            )
          }

          e.target.value =
            ''
        }}
      />
    </div>
  )
}