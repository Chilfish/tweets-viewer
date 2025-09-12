import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number
  once?: boolean
}

export function useIntersectionObserver<T extends HTMLElement>(
  options: UseIntersectionObserverOptions = {},
) {
  const { root, rootMargin, threshold, once = true } = options
  const [isIntersecting, setIntersecting] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const currentRef = ref.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true)
          if (once) {
            observer.unobserve(currentRef)
          }
        } else if (!once) {
          setIntersecting(false)
        }
      },
      { root, rootMargin, threshold },
    )

    observer.observe(currentRef)

    return () => {
      observer.unobserve(currentRef)
    }
  }, [root, rootMargin, threshold, once])

  return { ref, isIntersecting }
}
