# Estratégia Definitiva de Áudio (Cloudinary Streaming)

Conforme exigido na Fase 8, esta Prova de Conceito define a arquitetura exata de entrega de áudio.

## 1. Armazenamento e Upload
**Tipo de Asset:** Os áudios serão marcados com `resource_type: "video"` (o Cloudinary processa áudio sob esta flag) e `type: "authenticated"`.
**Segurança:** Isso significa que a URL original (ex: `https://res.cloudinary.com/demo/video/authenticated/song.mp3`) retornará **403 Forbidden** se acessada diretamente.
**Upload:** Será feito via Painel Admin chamando o endpoint de upload direto do Cloudinary `/v1_1/<cloud_name>/video/upload`, passando uma `signature` e um `timestamp`. A `signature` será gerada no Backend.

## 2. Assinatura no Backend (Cloud Function / Vercel Edge)
Não armazenaremos o `API_SECRET` no frontend.
Ao tentar dar Play em uma música, o `useAudio` (frontend) faz uma requisição HTTP para nosso backend:
`GET /api/get-audio-token?publicId=song123`

O Backend (Node.js) faz:
```javascript
const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name: '...', api_key: '...', api_secret: process.env.CLOUDINARY_SECRET });

// Gera uma URL assinada (Signed Delivery URL) que expira em 2 horas
const signedUrl = cloudinary.url('song123', {
  resource_type: 'video',
  type: 'authenticated',
  sign_url: true,
  expires_at: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // +2h
});
return res.json({ url: signedUrl });
```

## 3. Streaming e Autoplay (Frontend)
- O `useAudio` recebe a `signedUrl`.
- A tag `<audio src={signedUrl}>` requisita os blocos via *Range Requests* (HTTP 206 Partial Content). O Cloudinary suporta HTTP 206 nativamente para links assinados.
- Isso contorna as limitações de Autoplay do iOS Safari (que bloqueia mídias sem suporte a Range Requests).

## Decisão
Esta é a estratégia oficial. O `audioService.ts` será refatorado para chamar o nosso *Backend Proxy* simulado (ou real, dependendo de onde hospedarmos, como Firebase Functions).
