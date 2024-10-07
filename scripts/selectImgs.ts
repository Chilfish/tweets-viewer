import glob from 'fast-glob'

const folder = 'D:/Videos/BangDream/声优/青木凛'

const imgs = await glob(`${folder}/*.{jpg,png}`)
  .then(imgs => imgs.map(img => img.match(/\d{19}/)?.[0]).filter(Boolean))
  .then(imgs => Array.from(new Set(imgs)).sort())

console.log(imgs)
