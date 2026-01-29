import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { Hono } from 'hono'

const app = new Hono()
const users: EnrichedUser[] = [
  {
    createdAt: '2019-04-01T11:16:02.000Z',
    description: '声優。歌とゲーセンと競馬とパチスロとポーカーとTCGが好き。DJもします。Divinez:員弁ナオ/D4DJ:愛本りんく/Reバース:東山有/バンドリ:広町七深(Morfonica)/中野区:ナカノさん/川崎市:てるみ～にゃ/進化の実:エリス/PokerFate/B-idol/DC5FL',
    followersCount: 132718,
    followingsCount: 788,
    fullName: '西尾夕香',
    id: '1112674980603428866',
    isVerified: true,
    likeCount: 22143,
    location: '響 / GiGO POKER公認アンバサダー',
    pinnedTweet: '1769714176031949172',
    profileBanner: 'https://pbs.twimg.com/profile_banners/1112674980603428866/1631429806',
    profileImage: 'https://pbs.twimg.com/profile_images/1636675305812422656/Sz3moSfs_400x400.jpg',
    statusesCount: 13848,
    userName: '240y_k',
    birthdayString: '3/31',
    url: 'https://youtube.com/channel/UCfHUq_6X97dpBrJAw4xbrEA',
  },
]

app.get('/all', async (c) => {
  return c.json(users)
})

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const user = users.find(user => user.userName === name)
  if (!user)
    return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})

export default app
