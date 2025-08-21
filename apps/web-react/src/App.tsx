import './App.css'
import { tweetUrl } from '@tweets-viewer/shared'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className='mx-auto flex flex-col items-center'>
      <Button variant='default'>Hello</Button>
      <a href={tweetUrl('123')} target='_blank' rel='noopener noreferrer'>
        View Tweet
      </a>
    </main>
  )
}

export default App
