
import { PoseImage, DrawingEvaluation, Participant } from '../types';

/**
 * Formatea el puntaje de 0-100 a una escala de 0.0-10.0
 */
export const formatScoreForExport = (score: number) => {
  return (score / 10).toFixed(1);
};

/**
 * Auxiliar para envolver texto en Canvas
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
};

/**
 * Carga una imagen manejando CORS y URLs de datos
 */
const loadImage = async (url: string): Promise<HTMLImageElement> => {
  if (url.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Load failed'));
      };
      img.src = objectUrl;
    });
  } catch (e) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url + (url.includes('?') ? '&' : '?') + 'cors=' + Date.now();
    });
  }
};

/**
 * Dibuja una imagen cubriendo el área especificada con bordes redondeados
 */
const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) => {
  ctx.save();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.beginPath();
    // @ts-ignore
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();
  }

  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let drawW, drawH, drawX, drawY;

  if (imgRatio > targetRatio) {
    drawH = h;
    drawW = h * imgRatio;
    drawX = x + (w - drawW) / 2;
    drawY = y;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    drawX = x;
    drawY = y + (h - drawH) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
};

/**
 * Genera y descarga una imagen compuesta estilo "Story" con la pose y los dibujos
 */
export const exportPoseToImage = async (
  item: { pose: PoseImage; drawings: DrawingEvaluation[] },
  index: number,
  participants: Participant[]
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#050505');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`POSE #${index + 1}`, width / 2, 130);
  
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('SESIÓN DE DIBUJO!', width / 2, 180);

  const margin = 50;
  const refHeight = 720;
  const cardMargin = 30;
  const cardWidth = (width - (margin * 2) - cardMargin) / 2;
  const cardHeight = 440;

  try {
    const refImg = await loadImage(item.pose.url);
    drawCoverImage(ctx, refImg, margin, 250, width - (margin * 2), refHeight, 48);
    
    ctx.fillStyle = 'rgba(37, 99, 235, 0.95)';
    // @ts-ignore
    if (ctx.roundRect) {
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(margin + 40, 290, 200, 64, 20);
        ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REFERENCIA', margin + 140, 332);
  } catch (e) {
    ctx.fillStyle = '#111';
    ctx.fillRect(margin, 250, width - (margin * 2), refHeight);
  }

  const startY = 250 + refHeight + 60;
  const drawings = item.drawings.slice(0, 4);
  
  for (let i = 0; i < drawings.length; i++) {
    const draw = drawings[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + (col * (cardWidth + cardMargin));
    const y = startY + (row * (cardHeight + cardMargin));

    if (y + cardHeight > height - 60) break;

    try {
      const drawImg = await loadImage(draw.drawingThumbnail);
      const part = participants.find(p => p.id === draw.participantId);
      drawCoverImage(ctx, drawImg, x, y, cardWidth, cardHeight, 40);

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      // @ts-ignore
      if (ctx.roundRect) {
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(x + 15, y + 15, 160, 44, 12);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(part?.name?.toUpperCase() || 'ARTISTA', x + 95, y + 43);

      const isGood = draw.score >= 80;
      ctx.fillStyle = isGood ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)';
      // @ts-ignore
      if (ctx.roundRect) {
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(x + cardWidth - 115, y + 15, 100, 50, 12);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`${formatScoreForExport(draw.score)}`, x + cardWidth - 65, y + 48);
    } catch (e) {}
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('CREADO CON SESIÓN DE DIBUJO!', width/2, height - 70);

  const link = document.createElement('a');
  link.download = `pose-${index + 1}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
};

/**
 * Exporta toda la sesión como un "Recuerdo" con feedback de la IA incluido
 */
export const exportFullSessionToImage = async (
  summary: { pose: PoseImage; drawings: DrawingEvaluation[] }[],
  participants: Participant[],
  avgScore: string,
  totalEval: number
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  const width = 1920;
  // Aumentamos altura de sección para dar espacio al feedback
  const poseSectionHeight = 920; 
  const height = 400 + (summary.length * poseSectionHeight) + 200;
  
  canvas.width = width;
  canvas.height = height;

  // Fondo
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, width, height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#050505');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Header Principal
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 80px sans-serif';
  ctx.fillText('RECUERDO DE SESIÓN', 100, 180);

  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(`TOTAL DIBUJOS: ${totalEval}   •   PUNTUACIÓN MEDIA: ${avgScore}/10`, 100, 240);

  // Renderizar cada pose
  for (let i = 0; i < summary.length; i++) {
    const item = summary[i];
    const startY = 400 + (i * poseSectionHeight);
    
    // Separador
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, startY - 50);
    ctx.lineTo(width - 100, startY - 50);
    ctx.stroke();

    // Título de pose
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(100, startY, 10, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`POSE #${i + 1}`, 130, startY + 32);

    // Referencia
    const refW = 450;
    const refH = 600;
    try {
      const refImg = await loadImage(item.pose.url);
      drawCoverImage(ctx, refImg, 100, startY + 80, refW, refH, 40);
      
      ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
      // @ts-ignore
      if (ctx.roundRect) {
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(100 + 20, startY + 80 + 20, 140, 40, 12);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REF', 100 + 90, startY + 80 + 46);
    } catch (e) {}

    // Dibujos
    const drawXStart = 100 + refW + 60;
    const drawW = 300;
    const drawH = 400;
    const drawings = item.drawings.slice(0, 4);

    for (let j = 0; j < drawings.length; j++) {
      const draw = drawings[j];
      const col = j % 4;
      const x = drawXStart + (col * (drawW + 40));
      const y = startY + 80;

      try {
        const drawImg = await loadImage(draw.drawingThumbnail);
        const part = participants.find(p => p.id === draw.participantId);
        drawCoverImage(ctx, drawImg, x, y, drawW, drawH, 30);

        // Score overlay
        ctx.fillStyle = draw.score >= 80 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)';
        // @ts-ignore
        if (ctx.roundRect) {
          ctx.beginPath();
          // @ts-ignore
          ctx.roundRect(x + 15, y + 15, 70, 40, 10);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatScoreForExport(draw.score), x + 50, y + 42);

        // Nombre (Alineado a la izquierda)
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(part?.name || 'Artista', x, y + drawH + 35);

        // Feedback (Con ajuste de línea debajo del nombre)
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'italic 14px sans-serif';
        wrapText(ctx, `"${draw.feedback}"`, x, y + drawH + 60, drawW, 20);

      } catch (e) {}
    }
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('SESIÓN DE DIBUJO! • TU PROCESO ES TU ARTE', width / 2, height - 80);

  // Descarga
  const link = document.createElement('a');
  link.download = `recuerdo-sesion-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
};
