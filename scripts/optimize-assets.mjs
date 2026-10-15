import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'src/assets')
const output = path.join(source, 'optimized')
await mkdir(output, { recursive: true })
const assets = [
  ['Friendly bearded man in teal polo-1.png', 'man', 512],
  ['Friendly hijab-wearing woman in mint-2.png', 'woman', 512],
  ['Cheerful Curly-Haired Boy in Mint-3.png', 'boy', 512],
  ['Cheerful Girl in Mint and Teal-4.png', 'girl', 512],
  ['Silver-haired dad in a teal cardigan-5.png', 'father', 512],
  ['Smiling older mother in mint hijab-6.png', 'mother', 512],
  ['Caring Doctor with Mother and Daughter-7.png', 'healthcare-hero', 1536],
  ['Smiling Family with Health Shield-8.png', 'family', 1000],
  ['Teal Stethoscope Heart with Mint Leaves-9.png', 'stethoscope', 320],
  ['Mint Glass Heart and Stethoscope Tile-10.png', 'glass-tile', 384],
  ['Teal shield with sculpted heart-11.png', 'shield', 256],
]
for (const [file, name, width] of assets) {
  const result = await sharp(path.join(source, file))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 95 })
    .toFile(path.join(output, `${name}.webp`))
  console.log(`${name}.webp: ${Math.round(result.size / 1024)} KB`)
}
await mkdir(path.join(root, 'public'), { recursive: true })
await sharp(path.join(output, 'shield.webp'))
  .resize(64, 64)
  .png()
  .toFile(path.join(root, 'public/favicon.png'))
