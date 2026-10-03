// Quita el fondo crema del logo dejando el rojo, con bordes suaves.
// El texto es rojo (G y B bajos) y el fondo es crema (G y B altos):
// usamos eso para derivar el canal alfa de forma limpia.
const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "logo.png");
const OUT = path.join(__dirname, "..", "public", "logo-header.png");

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

(async () => {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = info.channels; // 4
  const { width, height } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * px;
      const g = data[i + 1];
      const b = data[i + 2];

      // "no-crema" = qué tan bajos están G y B respecto al blanco.
      const notCream = 255 - Math.min(g, b);
      // Estira y limpia: cualquier ruido de fondo cae a 0 opacidad.
      let alpha = clamp((notCream - 30) * 3, 0, 255);
      if (alpha < 30) alpha = 0;

      data[i + 3] = alpha;
      if (alpha > 40) {
        // Refuerza el rojo y marca el recuadro de contenido.
        data[i] = Math.max(data[i], 210);
        data[i + 1] = Math.min(g, 34);
        data[i + 2] = Math.min(b, 40);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 8;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cropW = Math.min(width - left, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(height - top, maxY - minY + 1 + pad * 2);

  await sharp(data, {
    raw: { width, height, channels: px },
  })
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toFile(OUT);

  const meta = await sharp(OUT).metadata();
  console.log(`Logo transparente listo: ${meta.width}x${meta.height} (${OUT})`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
