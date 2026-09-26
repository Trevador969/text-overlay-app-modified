'use client'

import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react'

import type {
  ImageEntry,
  TextLayer,
} from '@/lib/types'

import {
  renderToCanvas,
  hitTestLayer,
  buildFilter,
  drawLayer,
} from '@/lib/canvas'

import styles from './CanvasEditor.module.css'

type MediaElement =
  | HTMLImageElement
  | HTMLVideoElement

interface Props {
  entry: ImageEntry

  mediaEl:
  | MediaElement
  | null

  onLayerMove: (
    layerId: string,
    x: number,
    y: number
  ) => void

  onLayerSelect: (
    layerId: string
  ) => void
}

export default function CanvasEditor({
  entry,
  mediaEl,
  onLayerMove,
  onLayerSelect,
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement>(
      null
    )

  const animationRef =
    useRef<number | null>(
      null
    )

  const drag =
    useRef<{
      id: string
      ox: number
      oy: number
    } | null>(
      null
    )

  /*
  ============================================================
  RENDER DA MÍDIA
  ============================================================
  */

  useEffect(() => {
    const canvas =
      canvasRef.current

    if (
      !canvas ||
      !mediaEl
    ) {
      return
    }

    /*
    ==========================================================
    IMAGEM
    ==========================================================
    */

    if (
      entry.mediaType ===
      'image' &&
      mediaEl instanceof
      HTMLImageElement
    ) {
      renderToCanvas(
        canvas,
        mediaEl,
        entry.layers,
        entry.adjust
      )

      return
    }

    /*
    ==========================================================
    VÍDEO
    ==========================================================
    */

    if (
      entry.mediaType ===
      'video' &&
      mediaEl instanceof
      HTMLVideoElement
    ) {
      const video =
        mediaEl

      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {
        return
      }

      canvas.width =
        video.videoWidth

      canvas.height =
        video.videoHeight

      let destroyed =
        false

      const render =
        () => {
          if (
            destroyed
          ) {
            return
          }

          const ctx =
            canvas.getContext(
              '2d'
            )

          if (!ctx) {
            return
          }

          /*
          ================================================
          LIMPAR FRAME
          ================================================
          */

          ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          )

          /*
          ================================================
          DESENHAR VÍDEO
          ================================================
          */

          ctx.save()

          ctx.filter =
            buildFilter(
              entry.adjust
            )

          ctx.globalAlpha =
            entry.adjust.opacity

          try {
            ctx.drawImage(
              video,
              0,
              0,
              canvas.width,
              canvas.height
            )
          } catch {
            // vídeo ainda não possui
            // frame disponível
          }

          ctx.restore()

          /*
          ================================================
          DESENHAR TEXTOS
          ================================================
          */

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

          animationRef.current =
            requestAnimationFrame(
              render
            )
        }

      /*
      ================================================
      PREVIEW
      ================================================
      */

      video.muted =
        true

      video.loop =
        true

      video.playsInline =
        true

      video.currentTime =
        Math.min(
          video.currentTime,
          video.duration || 0
        )

      video
        .play()
        .catch(() => {
          /*
          Alguns navegadores
          bloqueiam autoplay.

          Nesse caso o primeiro
          frame ainda será mostrado.
          */
        })

      render()

      return () => {
        destroyed =
          true

        if (
          animationRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animationRef.current
          )
        }

        video.pause()
      }
    }

  }, [
    entry,
    mediaEl,
  ])

  /*
  ============================================================
  CONVERTER POSIÇÃO DA TELA PARA CANVAS
  ============================================================
  */

  const toCanvasCoords =
    useCallback(
      (
        clientX: number,
        clientY: number
      ) => {
        const canvas =
          canvasRef.current

        if (!canvas) {
          return {
            cx: 0,
            cy: 0,
          }
        }

        const rect =
          canvas
            .getBoundingClientRect()

        const scaleX =
          canvas.width /
          rect.width

        const scaleY =
          canvas.height /
          rect.height

        return {
          cx:
            (
              clientX -
              rect.left
            ) * scaleX,

          cy:
            (
              clientY -
              rect.top
            ) * scaleY,
        }
      },
      []
    )

  /*
  ============================================================
  ENCONTRAR LAYER CLICADA
  ============================================================
  */

  const findLayer =
    useCallback(
      (
        cx: number,
        cy: number
      ): TextLayer | null => {
        const canvas =
          canvasRef.current

        if (!canvas) {
          return null
        }

        const ctx =
          canvas.getContext(
            '2d'
          )

        if (!ctx) {
          return null
        }

        for (
          let i =
            entry.layers.length -
            1;

          i >= 0;

          i--
        ) {
          const layer =
            entry.layers[i]

          if (
            hitTestLayer(
              ctx,
              layer,
              cx,
              cy,
              canvas.width,
              canvas.height
            )
          ) {
            return layer
          }
        }

        return null
      },
      [
        entry.layers,
      ]
    )

  /*
  ============================================================
  MOUSE DOWN
  ============================================================
  */

  const onMouseDown =
    useCallback(
      (
        e:
          React.MouseEvent
      ) => {
        const {
          cx,
          cy,
        } =
          toCanvasCoords(
            e.clientX,
            e.clientY
          )

        const layer =
          findLayer(
            cx,
            cy
          )

        if (!layer) {
          return
        }

        onLayerSelect(
          layer.id
        )

        drag.current = {
          id: layer.id,

          ox:
            cx /
            (
              canvasRef
                .current
                ?.width ?? 1
            ) -
            layer.x,

          oy:
            cy /
            (
              canvasRef
                .current
                ?.height ?? 1
            ) -
            layer.y,
        }
      },
      [
        toCanvasCoords,
        findLayer,
        onLayerSelect,
      ]
    )

  /*
  ============================================================
  MOUSE MOVE
  ============================================================
  */

  const onMouseMove =
    useCallback(
      (
        e:
          React.MouseEvent
      ) => {
        const canvas =
          canvasRef.current

        if (!canvas) {
          return
        }

        const {
          cx,
          cy,
        } =
          toCanvasCoords(
            e.clientX,
            e.clientY
          )

        if (
          drag.current
        ) {
          const nx =
            cx /
            canvas.width -
            drag.current.ox

          const ny =
            cy /
            canvas.height -
            drag.current.oy

          onLayerMove(
            drag.current.id,

            Math.max(
              0,
              Math.min(
                1,
                nx
              )
            ),

            Math.max(
              0,
              Math.min(
                1,
                ny
              )
            )
          )

          canvas.style.cursor =
            'grabbing'

          return
        }

        const hit =
          findLayer(
            cx,
            cy
          )

        canvas.style.cursor =
          hit
            ? 'grab'
            : 'default'
      },
      [
        toCanvasCoords,
        onLayerMove,
        findLayer,
      ]
    )

  /*
  ============================================================
  MOUSE UP
  ============================================================
  */

  const onMouseUp =
    useCallback(
      () => {
        drag.current =
          null

        if (
          canvasRef.current
        ) {
          canvasRef.current
            .style.cursor =
            'default'
        }
      },
      []
    )

  /*
  ============================================================
  TOUCH START
  ============================================================
  */

  const onTouchStart =
    useCallback(
      (
        e:
          React.TouchEvent
      ) => {
        const touch =
          e.touches[0]

        if (!touch) {
          return
        }

        const {
          cx,
          cy,
        } =
          toCanvasCoords(
            touch.clientX,
            touch.clientY
          )

        const layer =
          findLayer(
            cx,
            cy
          )

        if (!layer) {
          return
        }

        onLayerSelect(
          layer.id
        )

        drag.current = {
          id: layer.id,

          ox:
            cx /
            (
              canvasRef
                .current
                ?.width ?? 1
            ) -
            layer.x,

          oy:
            cy /
            (
              canvasRef
                .current
                ?.height ?? 1
            ) -
            layer.y,
        }
      },
      [
        toCanvasCoords,
        findLayer,
        onLayerSelect,
      ]
    )

  /*
  ============================================================
  TOUCH MOVE
  ============================================================
  */

  const onTouchMove =
    useCallback(
      (
        e:
          React.TouchEvent
      ) => {
        e.preventDefault()

        if (
          !drag.current ||
          !canvasRef.current
        ) {
          return
        }

        const touch =
          e.touches[0]

        if (!touch) {
          return
        }

        const {
          cx,
          cy,
        } =
          toCanvasCoords(
            touch.clientX,
            touch.clientY
          )

        const nx =
          cx /
          canvasRef
            .current.width -
          drag.current.ox

        const ny =
          cy /
          canvasRef
            .current.height -
          drag.current.oy

        onLayerMove(
          drag.current.id,

          Math.max(
            0,
            Math.min(
              1,
              nx
            )
          ),

          Math.max(
            0,
            Math.min(
              1,
              ny
            )
          )
        )
      },
      [
        toCanvasCoords,
        onLayerMove,
      ]
    )

  return (
    <canvas
      ref={
        canvasRef
      }

      className={
        styles.canvas
      }

      onMouseDown={
        onMouseDown
      }

      onMouseMove={
        onMouseMove
      }

      onMouseUp={
        onMouseUp
      }

      onMouseLeave={
        onMouseUp
      }

      onTouchStart={
        onTouchStart
      }

      onTouchMove={
        onTouchMove
      }

      onTouchEnd={
        onMouseUp
      }
    />
  )
}