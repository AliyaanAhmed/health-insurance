import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
await mkdir('.qa', { recursive: true })
const comparisons = [
  ['C:/Users/Hp/Downloads/LandingPage-Reference.png', '.qa/landing-desktop.png', 'landing'],
  ['C:/Users/Hp/Downloads/Form-Reference.png', '.qa/family-desktop-viewport.png', 'family'],
]
for (const [reference, implementation, name] of comparisons) {
  const source = await sharp(reference)
    .resize(1536, 1024, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer()
  const rendered = await sharp(implementation)
    .resize(1536, 1024, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer()
  await sharp({ create: { width: 3072, height: 1024, channels: 3, background: '#ffffff' } })
    .composite([
      { input: source, left: 0, top: 0 },
      { input: rendered, left: 1536, top: 0 },
    ])
    .png()
    .toFile(`.qa/${name}-comparison.png`)
  const crop =
    name === 'landing'
      ? { left: 40, top: 505, width: 700, height: 400 }
      : { left: 30, top: 515, width: 960, height: 400 }
  const sourceCrop = await sharp(source)
    .extract(crop)
    .resize(960, 550, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer()
  const actualCrop = await sharp(rendered)
    .extract(crop)
    .resize(960, 550, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer()
  await sharp({ create: { width: 1920, height: 550, channels: 3, background: '#ffffff' } })
    .composite([
      { input: sourceCrop, left: 0, top: 0 },
      { input: actualCrop, left: 960, top: 0 },
    ])
    .png()
    .toFile(`.qa/${name}-detail-comparison.png`)
  console.log(`${name}: source left, implementation right, 1536x1024 at 1x`)
}
