import type { Meta, StoryObj } from '@storybook/react-vite'
import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { MyTweet } from '~/components/tweet/Tweet'

const meta = {
  title: 'Tweet',
  parameters: {
    layout: 'centered',
  },

} satisfies Meta<typeof MyTweet>

export default meta

type Story = StoryObj<typeof meta>

const tweet1: EnrichedTweet = {
  id: '2016474714647240908',
  lang: 'ja',
  url: 'https://twitter.com/ttisrn_0710/status/2016474714647240908',
  created_at: 'Wed Jan 28 11:33:30 +0000 2026',
  text: 'MyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM\n\n2/7はひなりんで登壇致します！\n何度観ても楽しいライブなので是非🙂‍↕️\n\n#わかれ道のその先へLIVEFILM',
  user: {
    id_str: '1353543505432301569',
    name: '立石凛',
    screen_name: 'ttisrn_0710',
    is_blue_verified: true,
    verified: false,
    profile_image_shape: 'Circle',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1952673634377756672/FWjMlNpA_normal.jpg',
  },
  entities: [
    {
      type: 'text',
      text: 'MyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM\n\n2/7はひなりんで登壇致します！\n何度観ても楽しいライブなので是非🙂‍↕️\n\n',
      index: 0,
    },
    {
      text: '#わかれ道のその先へLIVEFILM',
      type: 'hashtag',
      index: 1,
      href: 'https://twitter.com/hashtag/わかれ道のその先へLIVEFILM',
    },
  ],
  quoted_tweet_id: '2016458857263091800',
  is_inline_media: false,
  quoted_tweet: {
    id: '2016458857263091800',
    lang: 'ja',
    url: 'https://twitter.com/bang_dream_info/status/2016458857263091800',
    created_at: 'Wed Jan 28 10:30:30 +0000 2026',
    text: '＼新情報📢／\n\nMyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM📽️\n\n2/7(土)・8(日)に上映会が再び開催決定💡\nキャスト登壇のトークショーも✨\n\nチケット先着受付\n⏰1/30(金) 12:00 ～\n\n▼詳細はこちら\nhttps://t.co/WkjtKxUFdD\n\n#わかれ道のその先へLIVEFILM\n#バンドリ https://t.co/7o7DsEtyp0',
    user: {
      id_str: '3009772568',
      name: 'バンドリ！ BanG Dream! 公式',
      screen_name: 'bang_dream_info',
      is_blue_verified: false,
      verified: true,
      verified_type: 'Business',
      profile_image_shape: 'Square',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1973738194454872064/MRvlZY2A_normal.jpg',
    },
    entities: [
      {
        type: 'text',
        text: '＼新情報📢／\n\nMyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM📽️\n\n2/7(土)・8(日)に上映会が再び開催決定💡\nキャスト登壇のトークショーも✨\n\nチケット先着受付\n⏰1/30(金) 12:00 ～\n\n▼詳細はこちら\n',
        index: 0,
      },
      {
        display_url: 'bang-dream.com/news/2287',
        expanded_url: 'https://bang-dream.com/news/2287',
        url: 'https://t.co/WkjtKxUFdD',
        type: 'url',
        index: 1,
        text: 'bang-dream.com/news/2287',
        href: 'https://bang-dream.com/news/2287',
      },
      {
        type: 'text',
        text: '\n\n',
        index: 2,
      },
      {
        text: '#わかれ道のその先へLIVEFILM',
        type: 'hashtag',
        index: 3,
        href: 'https://twitter.com/hashtag/わかれ道のその先へLIVEFILM',
      },
      {
        type: 'text',
        text: '\n',
        index: 4,
      },
      {
        text: '#バンドリ',
        type: 'hashtag',
        index: 5,
        href: 'https://twitter.com/hashtag/バンドリ',
      },
    ],
    media_details: [
      {
        index: 0,
        media_url_https: 'https://pbs.twimg.com/media/G_uxxHBX0AAEIi1.jpg',
        original_info: {
          height: 1080,
          width: 1920,
        },
        type: 'photo',
      },
    ],
    is_inline_media: false,
  },
}

export const Main: Story = {
  render: () => <MyTweet tweet={tweet1} />,
}
