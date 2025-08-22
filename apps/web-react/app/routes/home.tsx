import { useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-background'>
      <h1 className='text-4xl font-bold mb-4 text-foreground'>
        Welcome to Tweets Viewer
      </h1>
      <p className='text-lg text-muted-foreground mb-8'>
        Explore tweets from your favorite users.
      </p>
      <Button onClick={() => navigate('/tweets/240y_k')}>Get Started</Button>
    </div>
  )
}
