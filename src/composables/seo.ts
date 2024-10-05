import { useHead, useSeoMeta } from '@unhead/vue'

const baseTitle = 'Twitter Archive Explorer'
const baseDes = 'Explore your Twitter archive with ease'

export function useSeo(
  { title, description }: {
    title: string
    description: string
  } = { title: '', description: '' },
) {
  title = title ? `${title} | ` : ''
  description = description ? `${description} | ` : ''

  useSeoMeta({
    title: `${title}${baseTitle}`,
    description: `${description}${baseDes}`,
    ogTitle: `${title}${baseTitle}`,
    ogDescription: `${description}${baseDes}`,
    twitterCard: 'summary',
  })

  useHead({
    title: `${title} ${baseTitle}`,
    meta: [
      { name: 'description', content: `${description}${baseDes}` },
      { name: 'theme-color', content: '#3388bb' },
    ],
  })
}
