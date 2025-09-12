import type React from 'react'
import type { JSX } from 'react'
import { cn } from '~/lib/utils'

interface LinkProps {
  url: string
  text?: string | JSX.Element
  className?: string
}

export function Link({ url, text, className }: LinkProps) {
  return (
    <a
      href={url}
      className={cn(
        className,
        'px-1 text-primary hover:underline underline-offset-4 wrap-anywhere',
      )}
      target='_blank'
      rel='noreferrer'
    >
      {text || url}
    </a>
  )
}

interface PeopleLinkProps {
  name: string
}

export function PeopleLink({ name }: PeopleLinkProps) {
  return <Link url={`https://x.com/${name}`} text={`@${name}`} />
}

interface HashTagLinkProps {
  tag: string
}

export function HashTagLink({ tag }: HashTagLinkProps) {
  return <Link url={`https://x.com/hashtag/${tag}`} text={`#${tag}`} />
}

// --- Parsing Logic (这部分几乎无需改动) ---
// 这些纯逻辑函数不依赖于特定的框架，可以原封不动地搬过来。

function _retweetInfo(text: string) {
  const regex = /^RT @(?<author>[^:]+):\s*(?<content>.+)/s
  const [_, name, restText] = text.match(regex) || [null, null, text]
  return {
    name,
    text: restText,
  }
}

function replyInfo(text: string) {
  const regex = /^@(?<author>\w+)\s(?<content>.+)/s
  const [_, name, restText] = text.match(regex) || [null, null, text]
  return {
    name,
    text: restText,
  }
}

// 注意这里的类型定义，JSX.Element 来自 react 而不是 vue/jsx-runtime
type ParsedText = string | JSX.Element

function hashTags(text: ParsedText): ParsedText | ParsedText[] {
  if (typeof text !== 'string') {
    return text
  }

  // --- 这就是关键的修改 ---
  // 使用 \S+ 来匹配所有非空白字符，直到遇到空格或字符串末尾。
  // 这能正确处理 #hello_world, #dev_life, #2024 等各种情况。
  const regex = /#(\S+)/gu

  const parts = text.split(regex)

  // 当使用带捕获组的 split 时，结果数组中：
  // - 偶数索引 (0, 2, 4...) 是非匹配的文本部分。
  // - 奇数索引 (1, 3, 5...) 是捕获组匹配到的内容（也就是我们的 tag，不含 #）。
  // 这个逻辑非常清晰且可靠。
  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) {
        // 这是一个被捕获的 tag
        return <HashTagLink key={`${part}-${idx}`} tag={part} />
      }
      // 这是常规文本
      return part
    })
    .filter(Boolean) // 过滤掉 text.split 可能产生的末尾空字符串
}

function links(text: ParsedText): ParsedText | ParsedText[] {
  if (typeof text !== 'string') {
    return text
  }

  const regex = /(https?:\/\/\S+)/g
  const parts = text.split(regex)

  return parts.map((part, idx) => {
    if (regex.test(part)) {
      // 同样的，可以用索引判断，但 test() 也行
      return <Link key={`${part}-${idx}`} url={part} />
    }
    return part
  })
}

function parseText(text: string): ParsedText[] {
  const tags = hashTags(text)
  // flatMap 的使用非常漂亮，直接平移
  const parsedLinks = (Array.isArray(tags) ? tags : [tags]).flatMap(
    (tag: ParsedText) => links(tag),
  )
  return parsedLinks as ParsedText[]
}

// --- Main Component ---

interface TweetTextProps {
  text: string
}

export const TweetText: React.FC<TweetTextProps> = ({ text }) => {
  // Vue 的 setup 函数里的逻辑，直接放在 React 函数组件的顶层作用域即可

  // const retweetTo = _retweetInfo(text) // 原代码中是 _retweetInfo，这里保持一致
  // if (retweetTo.name) {
  //   return (
  //     <>
  //       <p className="py-2">
  //         从
  //         <PeopleLink name={retweetTo.name!} />
  //         转推:
  //       </p>
  //       <p>
  //         {parseText(retweetTo.text)}
  //       </p>
  //     </>
  //   )
  // }

  const replyTo = replyInfo(text)
  if (replyTo.name) {
    return (
      <>
        <p className='py-2'>
          回复
          <PeopleLink name={replyTo.name || ''} />:
        </p>
        <p>{parseText(replyTo.text)}</p>
      </>
    )
  }

  // React 组件直接 return JSX，而不是像 Vue setup 那样返回一个渲染函数
  return <p className='pt-2'>{parseText(text)}</p>
}
