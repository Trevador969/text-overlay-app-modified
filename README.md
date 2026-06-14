# TextOverlay — Next.js App

## Como rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Funcionalidades
- Upload de múltiplas imagens de uma vez (arraste, clique ou Cole com Ctrl+V)
- Tira de imagens na parte superior para navegar entre elas
- Adicionar múltiplos textos por imagem
- Arrastar textos livremente na imagem
- Posição rápida (grid 3x3: topo/meio/baixo × esq/centro/dir)
- Controles: fonte, tamanho, peso, cor, alinhamento, opacidade, borda, sombra
- Exportar imagem atual ou todas de uma vez (PNG em resolução original)
- Colar imagens da área de transferência (Ctrl+V)

## Estrutura
- `app/` — Next.js App Router (layout, page, globals.css)
- `components/` — CanvasEditor, Sidebar, ImageStrip, DropZone
- `lib/` — types.ts, canvas.ts, defaults.ts
