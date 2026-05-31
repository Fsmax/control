const sharp = require("sharp")
const path = require("path")

const outDir = path.join(__dirname, "..", "public")
const BG = "#0A0A0A"
const FG = "#FAFAFA"
// lucide "Zap" (24x24 viewBox)
const ZAP =
  "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"

function svg(size, frac, rounded) {
  const k = (size * frac) / 24
  const off = (size - 24 * k) / 2
  const r = rounded ? Math.round(size * 0.22) : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BG}"/>
  <g transform="translate(${off},${off}) scale(${k})">
    <path d="${ZAP}" fill="${FG}" stroke="${FG}" stroke-width="1.2" stroke-linejoin="round"/>
  </g>
</svg>`
}

async function make(name, size, frac, rounded) {
  const buf = Buffer.from(svg(size, frac, rounded))
  await sharp(buf).png().toFile(path.join(outDir, name))
  console.log("ok:", name)
}

;(async () => {
  await make("icon-192.png", 192, 0.56, true)
  await make("icon-512.png", 512, 0.56, true)
  await make("icon-maskable-512.png", 512, 0.44, false) // safe-zone для maskable Android
  await make("apple-icon-180.png", 180, 0.56, true)
  console.log("done")
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
