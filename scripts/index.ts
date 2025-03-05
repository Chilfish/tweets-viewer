import glob from 'fast-glob'

export const dataFolder = 'D:/Downloads/tweet-data'

export const dataFolders = await glob(`${dataFolder}/*`, {
  onlyDirectories: true,
})
