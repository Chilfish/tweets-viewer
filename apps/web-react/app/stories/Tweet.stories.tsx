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

const tweetWithQoutedImage: EnrichedTweet = {
  id: '2016474714647240908',
  lang: 'ja',
  url: 'https://twitter.com/ttisrn_0710/status/2016474714647240908',
  created_at: 'Wed Jan 28 11:33:30 +0000 2026',
  user: {
    id_str: '1353543505432301569',
    name: '立石凛',
    screen_name: 'ttisrn_0710',
    is_blue_verified: true,
    profile_image_shape: 'Circle',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1952673634377756672/FWjMlNpA_normal.jpg',
  },
  text: 'MyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM\n\n2/7はひなりんで登壇致します！\n何度観ても楽しいライブなので是非🙂‍↕️\n\n#わかれ道のその先へLIVEFILM',
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
  reply_count: 9,
  like_count: 802,
  retweet_count: 3,
  view_count: 23421,
  quoted_tweet: {
    id: '2016458857263091800',
    lang: 'ja',
    url: 'https://twitter.com/bang_dream_info/status/2016458857263091800',
    created_at: 'Wed Jan 28 10:30:30 +0000 2026',
    user: {
      id_str: '3009772568',
      name: 'バンドリ！ BanG Dream! 公式',
      screen_name: 'bang_dream_info',
      is_blue_verified: false,
      profile_image_shape: 'Square',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1973738194454872064/MRvlZY2A_normal.jpg',
    },
    text: '＼新情報📢／\n\nMyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM📽️\n\n2/7(土)・8(日)に上映会が再び開催決定💡\nキャスト登壇のトークショーも✨\n\nチケット先着受付\n⏰1/30(金) 12:00 ～\n\n▼詳細はこちら\nhttps://t.co/WkjtKxUFdD\n\n#わかれ道のその先へLIVEFILM\n#バンドリ https://t.co/7o7DsEtyp0',
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
    reply_count: 1,
    like_count: 925,
    retweet_count: 54,
    view_count: 117640,
  },
}

const replyTweet: EnrichedTweet = {
  id: '2016849424664973597',
  lang: 'ja',
  url: 'https://twitter.com/240y_k/status/2016849424664973597',
  created_at: 'Thu Jan 29 12:22:28 +0000 2026',
  user: {
    id_str: '1112674980603428866',
    name: '西尾夕香',
    screen_name: '240y_k',
    is_blue_verified: true,
    profile_image_shape: 'Circle',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1636675305812422656/Sz3moSfs_normal.jpg',
  },
  text: '@lxxeju センスの塊すぎる素敵なMVに感動しました！！\nありがとうございました！！',
  parent_id: '2016463941162197006',
  in_reply_to_screen_name: 'lxxeju',
  entities: [
    {
      type: 'text',
      text: 'センスの塊すぎる素敵なMVに感動しました！！\nありがとうございました！！',
      index: 0,
    },
  ],
  is_inline_media: false,
  reply_count: 1,
  like_count: 10,
  retweet_count: 0,
  view_count: 367,
}

const withVideo: EnrichedTweet = {
  id: '2015045065127989553',
  lang: 'ja',
  url: 'https://twitter.com/240y_k/status/2015045065127989553',
  created_at: 'Sat Jan 24 12:52:35 +0000 2026',
  user: {
    id_str: '1112674980603428866',
    name: '西尾夕香',
    screen_name: '240y_k',
    is_blue_verified: true,
    profile_image_shape: 'Circle',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1636675305812422656/Sz3moSfs_normal.jpg',
  },
  text: '【オリジナル楽曲公開！】\n\n「hermit」\n作詞  西尾夕香\n作曲・編曲  藤井健太郎\n\nヤドカリは英語で言うとhermit crabだよ🦞🐚\nhttps://t.co/dLWM2WtLMe\n\n#西尾331計画 #nishio331project #おゆちゅーぶ https://t.co/DHSJsrvrX5',
  entities: [
    {
      type: 'text',
      text: '【オリジナル楽曲公開！】\n\n「hermit」\n作詞  西尾夕香\n作曲・編曲  藤井健太郎\n\nヤドカリは英語で言うとhermit crabだよ🦞🐚\n',
      index: 0,
    },
    {
      display_url: 'youtu.be/UqfPWVWqr7E?si…',
      expanded_url: 'https://youtu.be/UqfPWVWqr7E?si=wMqawoQspOdIwBge',
      url: 'https://t.co/dLWM2WtLMe',
      type: 'url',
      index: 1,
      text: 'youtu.be/UqfPWVWqr7E?si…',
      href: 'https://youtu.be/UqfPWVWqr7E?si=wMqawoQspOdIwBge',
    },
    {
      type: 'text',
      text: '\n\n',
      index: 2,
    },
    {
      text: '#西尾331計画',
      type: 'hashtag',
      index: 3,
      href: 'https://twitter.com/hashtag/西尾331計画',
    },
    {
      type: 'text',
      text: ' ',
      index: 4,
    },
    {
      text: '#nishio331project',
      type: 'hashtag',
      index: 5,
      href: 'https://twitter.com/hashtag/nishio331project',
    },
    {
      type: 'text',
      text: ' ',
      index: 6,
    },
    {
      text: '#おゆちゅーぶ',
      type: 'hashtag',
      index: 7,
      href: 'https://twitter.com/hashtag/おゆちゅーぶ',
    },
  ],
  media_details: [
    {
      index: 0,
      media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/2015044955929247744/pu/img/uGcJs1OXUm2pnq2C.jpg',
      original_info: {
        height: 720,
        width: 1280,
      },
      type: 'video',
      video_info: {
        aspect_ratio: [
          16,
          9,
        ],
        variants: [
          {
            bitrate: 2176000,
            content_type: 'video/mp4',
            url: 'https://video.twimg.com/ext_tw_video/2015044955929247744/pu/vid/avc1/1280x720/EQz4YPVK1QU-J24I.mp4?tag=12',
          },
        ],
      },
    },
  ],
  retweeted_original_id: '2016075571890160040',
  is_inline_media: false,
  reply_count: 9,
  like_count: 576,
  retweet_count: 6,
  view_count: 35731,
}

const with3Images: EnrichedTweet = {
  id: '2015050517031100453',
  lang: 'ja',
  url: 'https://twitter.com/240y_k/status/2015050517031100453',
  created_at: 'Sat Jan 24 13:14:15 +0000 2026',
  user: {
    id_str: '1112674980603428866',
    name: '西尾夕香',
    screen_name: '240y_k',
    is_blue_verified: true,
    profile_image_shape: 'Circle',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1636675305812422656/Sz3moSfs_normal.jpg',
  },
  text: '第1回 240 CUP in GiGO POKERありがとうございましたー！\n\n9位～！\n\n次回は、Dealer\'s shuffle up and deal!を次回は上手く言えるようになろうと思う。笑\n#gigopoker https://t.co/hTvomk1SFl',
  entities: [
    {
      type: 'text',
      text: '第1回 240 CUP in GiGO POKERありがとうございましたー！\n\n9位～！\n\n次回は、Dealer\'s shuffle up and deal!を次回は上手く言えるようになろうと思う。笑\n',
      index: 0,
    },
    {
      text: '#gigopoker',
      type: 'hashtag',
      index: 1,
      href: 'https://twitter.com/hashtag/gigopoker',
    },
    {
      type: 'separator',
      text: ' | ',
      index: 30000,
      mediaIndex: 0,
    },
    {
      type: 'media_alt',
      text: 'GiGO制服かわいい！',
      media_url: 'https://pbs.twimg.com/media/G_blwpRXsAEvQqE.jpg',
      index: 20000,
    },
    {
      type: 'separator',
      text: ' | ',
      index: 30002,
      mediaIndex: 2,
    },
    {
      type: 'media_alt',
      text: '表彰の証～！すべりこみ！！嬉し！！',
      media_url: 'https://pbs.twimg.com/media/G_blw26bkAATip2.jpg',
      index: 20002,
    },
  ],
  quoted_tweet_id: '2014967611084439985',
  media_details: [
    {
      index: 0,
      media_url_https: 'https://pbs.twimg.com/media/G_blwpRXsAEvQqE.jpg',
      original_info: {
        height: 1024,
        width: 767,
      },
      type: 'photo',
      ext_alt_text: 'GiGO制服かわいい！',
    },
    {
      index: 1,
      media_url_https: 'https://pbs.twimg.com/media/G_blwrQawAE1J7-.jpg',
      original_info: {
        height: 768,
        width: 1024,
      },
      type: 'photo',
    },
    {
      index: 2,
      media_url_https: 'https://pbs.twimg.com/media/G_blw26bkAATip2.jpg',
      original_info: {
        height: 759,
        width: 1024,
      },
      type: 'photo',
      ext_alt_text: '表彰の証～！すべりこみ！！嬉し！！',
    },
  ],
  is_inline_media: false,
  reply_count: 22,
  like_count: 828,
  retweet_count: 1,
  view_count: 29937,
  quoted_tweet: {
    id: '2014967611084439985',
    lang: 'ja',
    url: 'https://twitter.com/GiGOPOKER_SHIN/status/2014967611084439985',
    created_at: 'Sat Jan 24 07:44:49 +0000 2026',
    user: {
      id_str: '1897923897712123904',
      name: 'GiGO POKER新宿',
      screen_name: 'GiGOPOKER_SHIN',
      is_blue_verified: true,
      profile_image_shape: 'Circle',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1996380094278029312/WM8ZZ2BH_normal.png',
    },
    text: '【♠️240 CUP in GiGO POKER♠️】\n\n出場選手の皆様が入場され、開幕いたしました！！！\n\n皆様、優勝目指して頑張ってください‼\n\nDealer\'s shuffle up and deal!\n\n#西尾夕香 #GiGOpoker https://t.co/Hvt9pTghBe',
    entities: [
      {
        type: 'text',
        text: '【♠️240 CUP in GiGO POKER♠️】\n\n出場選手の皆様が入場され、開幕いたしました！！！\n\n皆様、優勝目指して頑張ってください‼\n\nDealer\'s shuffle up and deal!\n\n',
        index: 0,
      },
      {
        text: '#西尾夕香',
        type: 'hashtag',
        index: 1,
        href: 'https://twitter.com/hashtag/西尾夕香',
      },
      {
        type: 'text',
        text: ' ',
        index: 2,
      },
      {
        text: '#GiGOpoker',
        type: 'hashtag',
        index: 3,
        href: 'https://twitter.com/hashtag/GiGOpoker',
      },
    ],
    media_details: [
      {
        index: 0,
        media_url_https: 'https://pbs.twimg.com/media/G_aaSNqbsAAsRL6.jpg',
        original_info: {
          height: 4096,
          width: 4096,
        },
        type: 'photo',
      },
    ],
    is_inline_media: false,
    reply_count: 0,
    like_count: 115,
    retweet_count: 3,
    view_count: 32784,
  },
}

const withLinkCard: EnrichedTweet = {
  id: '2016728005641720003',
  lang: 'ja',
  url: 'https://twitter.com/bang_dream_info/status/2016728005641720003',
  created_at: 'Thu Jan 29 04:20:00 +0000 2026',
  user: {
    id_str: '3009772568',
    name: 'バンドリ！ BanG Dream! 公式',
    screen_name: 'bang_dream_info',
    is_blue_verified: false,
    profile_image_shape: 'Square',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1973738194454872064/MRvlZY2A_normal.jpg',
  },
  text: '／\nミニアニメ「元祖！バンドリちゃん」\n本日第17話配信・放送🌟\n＼\n\n第17話「チュチュPのカリスマラジオ」\nYouTube配信はこちら📺✨\nhttps://t.co/UE1LOaEzIb\n\n⟡22:00〜 YouTube「バンドリちゃんねる☆」ほかにて順次配信\n⟡23:25〜 TOKYO MXにて放送\n\nお見逃しなく❣\n\n#元祖バンドリちゃん',
  entities: [
    {
      type: 'text',
      text: '／\nミニアニメ「元祖！バンドリちゃん」\n本日第17話配信・放送🌟\n＼\n\n第17話「チュチュPのカリスマラジオ」\nYouTube配信はこちら📺✨\n',
      index: 0,
    },
    {
      display_url: 'youtube.com/watch?v=ZUg94j…',
      expanded_url: 'https://www.youtube.com/watch?v=ZUg94j8bOoQ',
      url: 'https://t.co/UE1LOaEzIb',
      type: 'url',
      index: 1,
      text: 'youtube.com/watch?v=ZUg94j…',
      href: 'https://www.youtube.com/watch?v=ZUg94j8bOoQ',
    },
    {
      type: 'text',
      text: '\n\n⟡22:00〜 YouTube「バンドリちゃんねる☆」ほかにて順次配信\n⟡23:25〜 TOKYO MXにて放送\n\nお見逃しなく❣\n\n',
      index: 2,
    },
    {
      text: '#元祖バンドリちゃん',
      type: 'hashtag',
      index: 3,
      href: 'https://twitter.com/hashtag/元祖バンドリちゃん',
    },
  ],
  card: {
    type: 'unified_card',
    url: 'https://www.youtube.com/watch?v=ZUg94j8bOoQ',
    title: 'ミニアニメ「元祖！バンドリちゃん」第17話',
    domain: 'youtube.com',
    imageUrl: 'https://pbs.twimg.com/media/G_zaUWHbcAAZolP.png',
  },
  is_inline_media: false,
  reply_count: 1,
  like_count: 555,
  retweet_count: 0,
  view_count: 27722,
}

export const TweetWithQoutedImage: Story = {
  render: () => <MyTweet tweet={tweetWithQoutedImage} />,
}

export const ReplyTweet: Story = {
  render: () => <MyTweet tweet={replyTweet} />,
}

export const TweetWithVideo: Story = {
  render: () => <MyTweet tweet={withVideo} />,
}

export const TweetWith3Images: Story = {
  render: () => <MyTweet tweet={with3Images} />,
}

export const TweetWithLinkCard: Story = {
  render: () => <MyTweet tweet={withLinkCard} />,
}
