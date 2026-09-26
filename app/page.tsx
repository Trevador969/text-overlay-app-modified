'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'

import type {
  ImageEntry,
  TextLayer,
  ImageAdjust,
} from '@/lib/types'

import {
  makeLayer,
  makeImageId,
  defaultAdjust,
} from '@/lib/defaults'

import {
  exportCanvas,
  buildFilter,
  drawLayer,
} from '@/lib/canvas'

import ImageStrip from '@/components/ImageStrip'
import CanvasEditor from '@/components/CanvasEditor'
import Sidebar from '@/components/Sidebar'
import DropZone from '@/components/DropZone'
import { exportEditedVideo } from '@/lib/video'

import styles from './page.module.css'

type MediaElement =
  | HTMLImageElement
  | HTMLVideoElement

/*
==============================================================
CACHE DOS ELEMENTOS
==============================================================
*/

const mediaElements =
  new Map<
    string,
    MediaElement
  >()

/*
==============================================================
CARREGAR IMAGEM
==============================================================
*/

function loadImage(
  src: string
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image()

      image.onload =
        () =>
          resolve(
            image
          )

      image.onerror =
        reject

      image.src =
        src
    }
  )
}

/*
==============================================================
CARREGAR VÍDEO
==============================================================
*/

function loadVideo(
  src: string
): Promise<HTMLVideoElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const video =
        document.createElement(
          'video'
        )

      video.preload =
        'metadata'

      video.playsInline =
        true

      video.muted =
        true

      video.loop =
        true

      video.onloadedmetadata =
        () => {
          resolve(
            video
          )
        }

      video.onerror =
        () => {
          reject(
            new Error(
              'Não foi possível carregar o vídeo.'
            )
          )
        }

      video.src =
        src

      video.load()
    }
  )
}

/*
==============================================================
NOME SEM EXTENSÃO
==============================================================
*/

function removeExtension(
  name: string
) {
  return name.replace(
    /\.[^.]+$/,
    ''
  )
}

/*
==============================================================
DOWNLOAD
==============================================================
*/

function downloadBlob(
  blob: Blob,
  filename: string
) {
  const url =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href =
    url

  link.download =
    filename

  document.body.appendChild(
    link
  )

  link.click()

  link.remove()

  setTimeout(
    () => {
      URL.revokeObjectURL(
        url
      )
    },
    10000
  )
}

/*
==============================================================
HOME
==============================================================
*/

export default function Home() {
  const [muteAllVideos, setMuteAllVideos] = useState(false)
  const videoExportLock = useRef(false)
  const [videoExportBusy, setVideoExportBusy] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; name: string } | null>(null)
  const [exportMessage, setExportMessage] = useState('')

  const [
    images,
    setImages,
  ] =
    useState<
      ImageEntry[]
    >([])

  const [
    activeImageId,
    setActiveImageId,
  ] =
    useState<
      string | null
    >(null)

  const activeEntry =
    images.find(
      item =>
        item.id ===
        activeImageId
    ) ?? null

  const activeMediaEl =
    activeImageId
      ? (
        mediaElements.get(
          activeImageId
        ) ?? null
      )
      : null

  /*
  ============================================================
  ADICIONAR IMAGENS / VÍDEOS
  ============================================================
  */

  const handleFiles =
    useCallback(
      async (
        files: FileList
      ) => {
        const validFiles =
          Array.from(
            files
          ).filter(
            file =>
              file.type.startsWith(
                'image/'
              ) ||
              file.type.startsWith(
                'video/'
              )
          )

        if (
          !validFiles.length
        ) {
          return
        }

        const newEntries:
          ImageEntry[] =
          []

        for (
          const file
          of validFiles
        ) {
          const src =
            URL.createObjectURL(
              file
            )

          const id =
            makeImageId()

          /*
          ====================================================
          VÍDEO
          ====================================================
          */

          if (
            file.type.startsWith(
              'video/'
            )
          ) {
            try {
              const video =
                await loadVideo(
                  src
                )

              mediaElements.set(
                id,
                video
              )

              const firstLayer =
                makeLayer({
                  x:
                    0.5,

                  y:
                    0.72,
                })

              newEntries.push({
                id,

                name:
                  file.name,

                src,

                mediaType:
                  'video',

                width:
                  video.videoWidth,

                height:
                  video.videoHeight,

                duration:
                  Number.isFinite(
                    video.duration
                  )
                    ? video.duration
                    : undefined,

                layers: [
                  firstLayer,
                ],

                activeLayerId:
                  firstLayer.id,

                adjust:
                  defaultAdjust(),

                audioSrc:
                  null,

                audioName:
                  null,
              })
            } catch (
            error
            ) {
              console.error(
                `Erro carregando ${file.name}`,
                error
              )

              URL.revokeObjectURL(
                src
              )
            }

            continue
          }

          /*
          ====================================================
          IMAGEM
          ====================================================
          */

          try {
            const image =
              await loadImage(
                src
              )

            mediaElements.set(
              id,
              image
            )

            const firstLayer =
              makeLayer({
                x:
                  0.5,

                y:
                  0.72,
              })

            newEntries.push({
              id,

              name:
                file.name,

              src,

              mediaType:
                'image',

              width:
                image.naturalWidth,

              height:
                image.naturalHeight,

              layers: [
                firstLayer,
              ],

              activeLayerId:
                firstLayer.id,

              adjust:
                defaultAdjust(),

              audioSrc:
                null,

              audioName:
                null,
            })
          } catch (
          error
          ) {
            console.error(
              `Erro carregando ${file.name}`,
              error
            )

            URL.revokeObjectURL(
              src
            )
          }
        }

        if (
          !newEntries.length
        ) {
          return
        }

        setImages(
          previous => [
            ...previous,
            ...newEntries,
          ]
        )

        setActiveImageId(
          newEntries[0].id
        )
      },
      []
    )

  /*
  ============================================================
  REMOVER MÍDIA
  ============================================================
  */

  const handleRemoveImage =
    useCallback(
      (
        id: string
      ) => {
        const media =
          mediaElements.get(
            id
          )

        if (
          media instanceof
          HTMLVideoElement
        ) {
          media.pause()

          media.removeAttribute(
            'src'
          )

          media.load()
        }

        mediaElements.delete(
          id
        )

        setImages(
          previous => {
            const removed =
              previous.find(
                item =>
                  item.id ===
                  id
              )

            if (
              removed?.src.startsWith(
                'blob:'
              )
            ) {
              URL.revokeObjectURL(
                removed.src
              )
            }

            const next =
              previous.filter(
                item =>
                  item.id !==
                  id
              )

            if (
              activeImageId ===
              id
            ) {
              setActiveImageId(
                next.length
                  ? next[
                    next.length -
                    1
                  ].id
                  : null
              )
            }

            return next
          }
        )
      },
      [
        activeImageId,
      ]
    )

  /*
  ============================================================
  UPDATE ENTRY
  ============================================================
  */

  const updateEntry =
    useCallback(
      (
        id: string,

        fn: (
          entry:
            ImageEntry
        ) => ImageEntry
      ) => {
        setImages(
          previous =>
            previous.map(
              item =>
                item.id ===
                  id
                  ? fn(
                    item
                  )
                  : item
            )
        )
      },
      []
    )

  /*
  ============================================================
  ADICIONAR TEXTO
  ============================================================
  */

  const addLayer =
    useCallback(
      (
        layer:
          TextLayer
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => ({
            ...entry,

            layers: [
              ...entry.layers,
              layer,
            ],

            activeLayerId:
              layer.id,
          })
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  ATUALIZAR TEXTO
  ============================================================
  */

  const updateLayer =
    useCallback(
      (
        layerId:
          string,

        patch:
          Partial<TextLayer>
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => ({
            ...entry,

            layers:
              entry.layers.map(
                layer =>
                  layer.id ===
                    layerId
                    ? {
                      ...layer,
                      ...patch,
                    }
                    : layer
              ),
          })
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  REMOVER TEXTO
  ============================================================
  */

  const removeLayer =
    useCallback(
      (
        layerId:
          string
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => {
            const layers =
              entry.layers.filter(
                layer =>
                  layer.id !==
                  layerId
              )

            return {
              ...entry,

              layers,

              activeLayerId:
                layers.length
                  ? layers[
                    layers.length -
                    1
                  ].id
                  : null,
            }
          }
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  SELECIONAR TEXTO
  ============================================================
  */

  const selectLayer =
    useCallback(
      (
        layerId:
          string
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => ({
            ...entry,

            activeLayerId:
              layerId,
          })
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  MOVER TEXTO
  ============================================================
  */

  const moveLayer =
    useCallback(
      (
        layerId:
          string,

        x:
          number,

        y:
          number
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => ({
            ...entry,

            layers:
              entry.layers.map(
                layer =>
                  layer.id ===
                    layerId
                    ? {
                      ...layer,
                      x,
                      y,
                    }
                    : layer
              ),
          })
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  AJUSTAR MÍDIA
  ============================================================
  */

  const updateAdjust =
    useCallback(
      (
        patch:
          Partial<ImageAdjust>
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => ({
            ...entry,

            adjust: {
              ...entry.adjust,
              ...patch,
            },
          })
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  ÁUDIO EXTRA
  ============================================================
  */

  const handleAudioFile =
    useCallback(
      (
        file: File
      ) => {
        if (
          !activeImageId
        ) {
          return
        }

        const reader =
          new FileReader()

        reader.onload =
          event => {
            const src =
              event.target
                ?.result as
              | string
              | null

            if (!src) {
              return
            }

            updateEntry(
              activeImageId,

              entry => ({
                ...entry,

                audioSrc:
                  src,

                audioName:
                  file.name,
              })
            )
          }

        reader.readAsDataURL(
          file
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  REMOVER ÁUDIO
  ============================================================
  */

  const handleRemoveAudio =
    useCallback(
      () => {
        if (
          !activeImageId
        ) {
          return
        }

        updateEntry(
          activeImageId,

          entry => ({
            ...entry,

            audioSrc:
              null,

            audioName:
              null,
          })
        )
      },
      [
        activeImageId,
        updateEntry,
      ]
    )

  /*
  ============================================================
  APLICAR ÁUDIO EM TODAS
  ============================================================
  */

  const handleApplyAudioToAll =
    useCallback(
      () => {
        if (
          !activeEntry ||
          !activeEntry.audioSrc
        ) {
          return
        }

        const {
          audioSrc,
          audioName,
        } =
          activeEntry

        setImages(
          previous =>
            previous.map(
              item =>
                item.id ===
                  activeEntry.id
                  ? item
                  : {
                    ...item,

                    audioSrc,

                    audioName,
                  }
            )
        )
      },
      [
        activeEntry,
      ]
    )

  /*
  ============================================================
  APLICAR TEXTO EM TODAS AS MÍDIAS
  ============================================================
  */

  const handleApplyToAll =
    useCallback(
      () => {
        if (
          !activeEntry ||
          images.length <=
          1
        ) {
          return
        }

        const sourceLayers =
          activeEntry.layers

        setImages(
          previous =>
            previous.map(
              item => {
                if (
                  item.id ===
                  activeEntry.id
                ) {
                  return item
                }

                const newLayers =
                  sourceLayers.map(
                    layer => ({
                      ...layer,

                      id:
                        typeof crypto !==
                          'undefined' &&
                          crypto.randomUUID
                          ? crypto.randomUUID()
                          : `layer-${Date.now()}-${Math.random()
                            .toString(
                              36
                            )
                            .slice(
                              2
                            )}`,
                    })
                  )

                return {
                  ...item,

                  layers:
                    newLayers,

                  activeLayerId:
                    newLayers[0]
                      ?.id ??
                    null,
                }
              }
            )
        )
      },
      [
        activeEntry,
        images.length,
      ]
    )

  /*
  ============================================================
  EXPORTAR IMAGEM
  ============================================================
  */

  const handleExport =
    useCallback(
      () => {
        if (
          !activeEntry ||
          activeEntry.mediaType !==
          'image'
        ) {
          return
        }

        const media =
          mediaElements.get(
            activeEntry.id
          )

        if (
          !media ||
          !(
            media instanceof
            HTMLImageElement
          )
        ) {
          return
        }

        const url =
          exportCanvas(
            media,
            activeEntry.layers,
            activeEntry.adjust
          )

        const link =
          document.createElement(
            'a'
          )

        link.download =
          `overlay_${removeExtension(
            activeEntry.name
          )}.png`

        link.href =
          url

        link.click()
      },
      [
        activeEntry,
      ]
    )

  /*
  ============================================================
  EXPORTAR TODAS AS IMAGENS
  ============================================================
  */

  const handleExportAll =
    useCallback(
      () => {
        const onlyImages =
          images.filter(
            entry =>
              entry.mediaType ===
              'image'
          )

        onlyImages.forEach(
          (
            entry,
            index
          ) => {
            const media =
              mediaElements.get(
                entry.id
              )

            if (
              !media ||
              !(
                media instanceof
                HTMLImageElement
              )
            ) {
              return
            }

            const url =
              exportCanvas(
                media,
                entry.layers,
                entry.adjust
              )

            const link =
              document.createElement(
                'a'
              )

            link.download =
              `overlay_${removeExtension(
                entry.name
              )}.png`

            link.href =
              url

            setTimeout(
              () => {
                link.click()
              },
              index * 150
            )
          }
        )
      },
      [
        images,
      ]
    )

  /*
  ============================================================
  EXPORTAR IMAGEM COMO VÍDEO
  ============================================================
  */

  const exportImageAsVideo =
    useCallback(
      async (
        entry:
          ImageEntry
      ) => {
        const media =
          mediaElements.get(
            entry.id
          )

        if (
          !media ||
          !(
            media instanceof
            HTMLImageElement
          )
        ) {
          return
        }

        const canvas =
          document.createElement(
            'canvas'
          )

        canvas.width =
          media.naturalWidth

        canvas.height =
          media.naturalHeight

        const ctx =
          canvas.getContext(
            '2d'
          )

        if (!ctx) {
          return
        }

        /*
        ======================================================
        DESENHAR IMAGEM
        ======================================================
        */

        ctx.filter =
          buildFilter(
            entry.adjust
          )

        ctx.globalAlpha =
          entry.adjust.opacity

        ctx.drawImage(
          media,
          0,
          0,
          canvas.width,
          canvas.height
        )

        ctx.filter =
          'none'

        ctx.globalAlpha =
          1

        entry.layers.forEach(
          layer => {
            drawLayer(
              ctx,
              layer,
              canvas.width,
              canvas.height
            )
          }
        )

        /*
        ======================================================
        STREAM
        ======================================================
        */

        const canvasStream =
          canvas.captureStream(
            30
          )

        const tracks:
          MediaStreamTrack[] =
          [
            ...canvasStream
              .getVideoTracks(),
          ]

        let duration =
          5

        let audioContext:
          AudioContext |
          null =
          null

        /*
        ======================================================
        ÁUDIO OPCIONAL
        ======================================================
        */

        if (
          entry.audioSrc
        ) {
          try {
            audioContext =
              new AudioContext()

            await audioContext.resume()

            const response =
              await fetch(
                entry.audioSrc
              )

            const arrayBuffer =
              await response.arrayBuffer()

            const decoded =
              await audioContext.decodeAudioData(
                arrayBuffer
              )

            duration =
              decoded.duration

            // Preserve the clip duration even when the added audio is muted.
            if (!muteAllVideos) {
              const destination = audioContext.createMediaStreamDestination()
              const source = audioContext.createBufferSource()
              source.buffer = decoded
              source.connect(destination)
              source.start(0)

              const audioTrack = destination.stream.getAudioTracks()[0]
              if (audioTrack) tracks.push(audioTrack)
            }
          } catch (
          error
          ) {
            console.warn(
              'Erro ao processar áudio:',
              error
            )
          }
        }

        const stream =
          new MediaStream(
            tracks
          )

        const mimeType =
          MediaRecorder.isTypeSupported(
            'video/webm;codecs=vp9,opus'
          )
            ? 'video/webm;codecs=vp9,opus'
            : MediaRecorder.isTypeSupported(
              'video/webm;codecs=vp8,opus'
            )
              ? 'video/webm;codecs=vp8,opus'
              : 'video/webm'

        const recorder =
          new MediaRecorder(
            stream,
            {
              mimeType,

              videoBitsPerSecond:
                8_000_000,
            }
          )

        const chunks:
          BlobPart[] =
          []

        recorder.ondataavailable =
          event => {
            if (
              event.data.size >
              0
            ) {
              chunks.push(
                event.data
              )
            }
          }

        recorder.onstop =
          () => {
            const blob =
              new Blob(
                chunks,
                {
                  type:
                    mimeType,
                }
              )

            downloadBlob(
              blob,

              `video_${removeExtension(
                entry.name
              )}.webm`
            )

            audioContext
              ?.close()
              .catch(
                () => { }
              )
          }

        const finished = new Promise<void>(resolve => {
          recorder.addEventListener('stop', () => resolve(), { once: true })
        })

        recorder.start(
          250
        )

        setTimeout(
          () => {
            if (
              recorder.state !==
              'inactive'
            ) {
              recorder.stop()
            }
          },
          Math.max(
            0.5,
            duration
          ) * 1000
        )
        await finished
      },
      [muteAllVideos]
    )

  /*
  ============================================================
  EXPORTAR VÍDEO ORIGINAL COM TEXTOS
  ============================================================
  */

  const exportUploadedVideo = useCallback(async (entry: ImageEntry) => {
    const blob = await exportEditedVideo(entry, muteAllVideos)
    downloadBlob(blob, `editado_${removeExtension(entry.name)}.webm`)
  }, [muteAllVideos])

  /*
  ============================================================
  EXPORTAR COMO VÍDEO
  ============================================================
  */

  const handleExportVideo =
    useCallback(
      async (
        entry:
          ImageEntry
      ) => {
        if (videoExportLock.current) return
        videoExportLock.current = true
        setVideoExportBusy(true)
        setExportMessage('')
        try {
          if (
            entry.mediaType ===
            'video'
          ) {
            await exportUploadedVideo(
              entry
            )

            return
          }

          await exportImageAsVideo(
            entry
          )
        } catch (
        error
        ) {
          console.error(
            'Erro ao exportar vídeo:',
            error
          )

          alert(
            'Não foi possível exportar o vídeo.'
          )
        } finally {
          videoExportLock.current = false
          setVideoExportBusy(false)
        }
      },
      [
        exportUploadedVideo,
        exportImageAsVideo,
      ]
    )

  const handleExportAllVideos = useCallback(async () => {
    const videos = images.filter(entry => entry.mediaType === 'video')
    if (!videos.length || videoExportLock.current) return

    videoExportLock.current = true
    setVideoExportBusy(true)
    setExportMessage('')
    setBatchProgress({ current: 0, total: videos.length, name: 'Preparando os vídeos…' })
    try {
      const { default: JSZip } = await import('jszip')
      const archive = new JSZip()
      const failures: string[] = []
      let completed = 0

      // React updates entries immutably, so this batch keeps the edits from the click.
      for (let index = 0; index < videos.length; index++) {
        const entry = videos[index]
        setBatchProgress({ current: index + 1, total: videos.length, name: entry.name })
        try {
          const blob = await exportEditedVideo(entry, muteAllVideos)
          const safeName = removeExtension(entry.name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_') || 'video'
          const filename = `${String(index + 1).padStart(3, '0')}_editado_${safeName}.webm`
          archive.file(filename, blob)
          completed++
        } catch (error) {
          console.error(`Erro ao exportar ${entry.name}:`, error)
          failures.push(entry.name)
        }
      }

      if (completed) {
        setBatchProgress({ current: videos.length, total: videos.length, name: 'Preparando o arquivo ZIP…' })
        const zip = await archive.generateAsync({ type: 'blob', compression: 'STORE' })
        downloadBlob(zip, 'videos_editados.zip')
      }
      setExportMessage(failures.length
        ? `${completed} de ${videos.length} vídeos exportados. Falha em: ${failures.join(', ')}.`
        : `${completed} vídeo${completed === 1 ? '' : 's'} editado${completed === 1 ? '' : 's'} no arquivo videos_editados.zip.`)
    } catch (error) {
      console.error('Erro ao baixar todos os vídeos:', error)
      setExportMessage('Não foi possível preparar o download. Tente novamente.')
    } finally {
      videoExportLock.current = false
      setVideoExportBusy(false)
      setBatchProgress(null)
    }
  }, [images, muteAllVideos])

  /*
  ============================================================
  CTRL + V / COLAR IMAGEM
  ============================================================
  */

  useEffect(() => {
    const onPaste =
      (
        event:
          ClipboardEvent
      ) => {
        const items =
          Array.from(
            event.clipboardData
              ?.items ??
            []
          )

        const mediaItems =
          items.filter(
            item =>
              item.type.startsWith(
                'image/'
              ) ||
              item.type.startsWith(
                'video/'
              )
          )

        if (
          !mediaItems.length
        ) {
          return
        }

        const files =
          mediaItems
            .map(
              item =>
                item.getAsFile()
            )
            .filter(
              (
                file
              ): file is File =>
                Boolean(
                  file
                )
            )

        const transfer =
          new DataTransfer()

        files.forEach(
          file =>
            transfer.items.add(
              file
            )
        )

        if (
          transfer.files
            .length
        ) {
          handleFiles(
            transfer.files
          )
        }
      }

    window.addEventListener(
      'paste',
      onPaste
    )

    return () => {
      window.removeEventListener(
        'paste',
        onPaste
      )
    }
  }, [
    handleFiles,
  ])

  /*
  ============================================================
  DROP NA ÁREA
  ============================================================
  */

  const handleAreaDrop =
    useCallback(
      (
        event:
          React.DragEvent
      ) => {
        event.preventDefault()

        if (
          event.dataTransfer
            .files.length
        ) {
          handleFiles(
            event.dataTransfer
              .files
          )
        }
      },
      [
        handleFiles,
      ]
    )

  /*
  ============================================================
  LIMPEZA AO DESMONTAR
  ============================================================
  */

  useEffect(
    () => {
      return () => {
        mediaElements.forEach(
          element => {
            if (
              element instanceof
              HTMLVideoElement
            ) {
              element.pause()
            }
          }
        )
      }
    },
    []
  )

  /*
  ============================================================
  ESTADOS VISUAIS
  ============================================================
  */

  const isEmpty =
    images.length ===
    0

  const imageAmount =
    images.filter(
      item =>
        item.mediaType ===
        'image'
    ).length

  const videoAmount =
    images.filter(
      item =>
        item.mediaType ===
        'video'
    ).length

  /*
  ============================================================
  JSX
  ============================================================
  */

  return (
    <div
      className={
        styles.app
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div
          className={
            styles.logo
          }
        >
          <span
            className={
              styles.logoIcon
            }
          >
            🎬
          </span>

          <span
            className={
              styles.logoText
            }
          >
            TextOverlay
          </span>
        </div>

        <span
          className={
            styles.headerSub
          }
        >
          {isEmpty
            ? 'Faça upload de imagens ou vídeos para começar'
            : `${images.length} mídia${images.length >
              1
              ? 's'
              : ''
            } carregada${images.length >
              1
              ? 's'
              : ''
            } · ${imageAmount} imagem${imageAmount !==
              1
              ? 's'
              : ''
            } · ${videoAmount} vídeo${videoAmount !==
              1
              ? 's'
              : ''
            }`}
        </span>
      </header>

      <div
        className={
          styles.body
        }
      >
        <Sidebar
          onExportAllVideos={handleExportAllVideos}
          videoCount={videoAmount}
          videoExportBusy={videoExportBusy}
          batchProgress={batchProgress}
          exportMessage={exportMessage}
          muteAllVideos={muteAllVideos}
          onMuteAllVideosChange={setMuteAllVideos}

          entry={
            activeEntry
          }

          onLayerAdd={
            addLayer
          }

          onLayerUpdate={
            updateLayer
          }

          onLayerRemove={
            removeLayer
          }

          onLayerSelect={
            selectLayer
          }

          onAdjustUpdate={
            updateAdjust
          }

          onAudioFile={
            handleAudioFile
          }

          onAudioRemove={
            handleRemoveAudio
          }

          onApplyAudioToAll={
            handleApplyAudioToAll
          }

          onExport={
            handleExport
          }

          onExportAll={
            handleExportAll
          }

          onExportVideo={() => {
            if (
              activeEntry
            ) {
              void handleExportVideo(
                activeEntry
              )
            }
          }}

          onApplyToAll={
            handleApplyToAll
          }

          imageCount={
            images.length
          }
        />

        <main
          className={
            styles.main
          }
        >
          {images.length >
            0 && (
              <ImageStrip
                images={
                  images
                }

                activeId={
                  activeImageId
                }

                onSelect={
                  setActiveImageId
                }

                onRemove={
                  handleRemoveImage
                }

                onAdd={
                  handleFiles
                }
              />
            )}

          <div
            className={
              styles.canvasArea
            }

            onDrop={
              handleAreaDrop
            }

            onDragOver={e =>
              e.preventDefault()
            }
          >
            {isEmpty ? (
              <DropZone
                onFiles={
                  handleFiles
                }
              />
            ) : activeEntry &&
              activeMediaEl ? (
              <CanvasEditor
                key={
                  activeEntry.id
                }

                entry={
                  activeEntry
                }

                mediaEl={
                  activeMediaEl
                }

                onLayerMove={
                  moveLayer
                }

                onLayerSelect={
                  selectLayer
                }
              />
            ) : (
              <div
                className={
                  styles.noSelection
                }
              >
                <span>
                  Selecione uma
                  mídia acima
                </span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
