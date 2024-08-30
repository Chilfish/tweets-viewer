import { defineComponent } from 'vue'
import type { JSX } from 'vue/jsx-runtime'
import { HashTagLink, Link, PeopleLink } from './link'

function retweetInfo(text: string) {
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

type ParsedText = string | JSX.Element
function hashTags(text: ParsedText) {
  if (typeof text !== 'string') {
    return text
  }

  const regex = /#([\p{L}\p{N}]+)/gu
  const parts = text.split(regex)

  return parts.map((part, idx) => {
    if (idx === 0 && !part.startsWith('#')) {
      return part
    }
    if (regex.test(`#${part}`)) {
      return HashTagLink(part)
    }
    else {
      return part
    }
  })
}
function links(text: ParsedText) {
  if (typeof text !== 'string') {
    return text
  }

  const regex = /(https:\/\/t.co\/\w+)/g
  const parts = text.split(regex)

  return parts.map((part) => {
    if (regex.test(part)) {
      return Link(part)
    }
    else {
      return part
    }
  })
}
function parseText(text: string): ParsedText[] {
  const tags = hashTags(text) as ParsedText[]
  const parsedLinks = tags.flatMap((tag: ParsedText) => links(tag))
  return parsedLinks
}

export const PostText = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup({ text }) {
    const retweetTo = retweetInfo(text)
    if (retweetTo.name) {
      return () => (
        <>
          <p class="py-2">
            从
            {PeopleLink(retweetTo.name!)}
            转推:
          </p>
          <p>
            {parseText(retweetTo.text)}
          </p>
        </>
      )
    }

    const replyTo = replyInfo(text)
    if (replyTo.name) {
      return () => (
        <>
          <p class="py-2">
            回复
            {PeopleLink(replyTo.name!)}
            :
          </p>
          <p>
            {parseText(replyTo.text)}
          </p>
        </>
      )
    }

    return () => (
      <>
        <p class="py-2">
          {parseText(text)}
        </p>

      </>
    )
  },
})
