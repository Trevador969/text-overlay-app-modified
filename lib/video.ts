import type { ImageEntry } from './types'
import { buildFilter, drawLayer } from './canvas'

/** Render the saved edits into a new video, shared by individual and bulk exports. */
export async function exportEditedVideo(entry: ImageEntry, muted: boolean): Promise<Blob> {
  const video = document.createElement('video')
  video.preload = 'auto'
  video.playsInline = true
  video.muted = muted

  let audioContext: AudioContext | null = null
  let extraAudio: AudioBufferSourceNode | null = null
  let recorder: MediaRecorder | null = null
  const tracks: MediaStreamTrack[] = []
  let animation = 0
  let recordingTimeout: ReturnType<typeof setTimeout> | undefined

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout)
        video.onloadeddata = null
        video.onerror = null
      }
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('O vídeo demorou demais para carregar.'))
      }, 30_000)
      video.onloadeddata = () => { cleanup(); resolve() }
      video.onerror = () => { cleanup(); reject(new Error('Não foi possível carregar o vídeo.')) }
      video.src = entry.src
      video.load()
    })

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível preparar a edição do vídeo.')
    const canvasStream = canvas.captureStream(30)
    tracks.push(...canvasStream.getVideoTracks())

    if (!muted) {
      audioContext = new AudioContext()
      await audioContext.resume()
      const destination = audioContext.createMediaStreamDestination()
      tracks.push(...destination.stream.getAudioTracks())
      audioContext.createMediaElementSource(video).connect(destination)

      if (entry.audioSrc) {
        const response = await fetch(entry.audioSrc)
        if (!response.ok) throw new Error('Não foi possível carregar o áudio extra.')
        const buffer = await audioContext.decodeAudioData(await response.arrayBuffer())
        extraAudio = audioContext.createBufferSource()
        extraAudio.buffer = buffer
        extraAudio.connect(destination)
      }
    }

    const mimeType = (muted
      ? ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    ).find(type => MediaRecorder.isTypeSupported(type))
    if (!mimeType) throw new Error('Este navegador não suporta exportação de vídeo.')

    const outputStream = new MediaStream(tracks)
    const activeRecorder = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 8_000_000 })
    recorder = activeRecorder
    const chunks: BlobPart[] = []

    return await new Promise<Blob>((resolve, reject) => {
      activeRecorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data)
      }
      activeRecorder.onerror = () => reject(new Error('Falha ao gravar o vídeo.'))
      activeRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        if (blob.size) resolve(blob)
        else reject(new Error('O vídeo exportado ficou vazio.'))
      }
      video.onerror = () => reject(new Error('A leitura do vídeo foi interrompida.'))
      video.onended = () => {
        if (activeRecorder.state !== 'inactive') activeRecorder.stop()
      }

      const render = () => {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.save()
          ctx.filter = buildFilter(entry.adjust)
          ctx.globalAlpha = entry.adjust.opacity
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          ctx.restore()
          entry.layers.forEach(layer => drawLayer(ctx, layer, canvas.width, canvas.height))
          if (!video.ended) animation = requestAnimationFrame(render)
        } catch (error) { reject(error) }
      }

      const duration = Number.isFinite(video.duration) ? video.duration : (entry.duration ?? 3600)
      recordingTimeout = setTimeout(() => reject(new Error('A exportação do vídeo foi interrompida.')), Math.max(60_000, duration * 2000 + 30_000))
      activeRecorder.start(250)
      video.play().then(() => {
        extraAudio?.start()
        render()
      }).catch(reject)
    })
  } finally {
    clearTimeout(recordingTimeout)
    cancelAnimationFrame(animation)
    if (recorder) {
      recorder.onstop = null
      recorder.onerror = null
      recorder.ondataavailable = null
      if (recorder.state !== 'inactive') recorder.stop()
    }
    video.pause()
    video.onerror = null
    video.onended = null
    video.removeAttribute('src')
    video.load()
    tracks.forEach(track => track.stop())
    if (audioContext) await audioContext.close().catch(() => {})
  }
}
