import { useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <h1 className='text-4xl font-bold mb-4'>Welcome to Tweets Viewer</h1>
      <p className='text-lg text-gray-600 mb-8'>
        Explore tweets from your favorite users.
      </p>
      <Button onClick={() => navigate('/tweets/1')}>Get Started</Button>
    </div>
  )
}
