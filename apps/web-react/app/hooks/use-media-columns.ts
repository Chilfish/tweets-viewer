import { useEffect, useState } from 'react'

export function useMediaColumns() {
  const [columns, setColumns] = useState(2)

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setColumns(4) // lg
      }
      else if (width >= 768) {
        setColumns(3) // md
      }
      else {
        setColumns(2) // default
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  return columns
}
