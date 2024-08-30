import Fuse from 'fuse.js'

export function buildSearch(data: {
  id: string
  text: string
}[]) {
  const index = Fuse.createIndex(['text'], data)
  const fuse = new Fuse(data, {
    includeScore: true,
    keys: ['text'],
    ignoreLocation: true,
    useExtendedSearch: true,
  }, index)

  const searchToken = ['=', '!', '^', '\'']

  return {
  /**
   * TODO: 更多的搜索选项
   * 全文匹配搜索
   * @param text
   * @returns 返回匹配的 id 列表
   */
    search: (text: string) => {
      const query = decodeURIComponent(text)
        .split(' ')
        .map(t => searchToken.some(s => t.startsWith(s)) ? t : `'${t}`)
        .join(' ')

      return fuse.search(query)
        .map(r => r.item.id)
        .sort((a, b) => +a - +b)
    },
  }
}
