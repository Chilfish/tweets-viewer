export function Link(url: string, text?: string) {
  return (
    <a
      href={url}
      class="px-1 text-main hover:underline"
      target="_blank"
    >
      {text || url}
    </a>
  )
}
export function PeopleLink(name: string) {
  return Link(`https://x.com/${name}`, `@${name}`)
}
export function HashTagLink(tag: string) {
  return Link(`https://x.com/hashtag/${tag}`, `#${tag}`)
}
