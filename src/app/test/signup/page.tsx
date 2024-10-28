'use client'
import { KBarProvider, KBarPortal, KBarPositioner, KBarAnimator, KBarSearch } from 'kbar'
import { useEffect } from 'react'

function Page() {
  const actions = [
    {
      id: 'blog',
      name: 'Blog',
      shortcut: ['b'],
      keywords: 'writing words',
      perform: () => (window.location.pathname = 'blog'),
    },
    // Add more actions here
  ]

  // useEffect(() => {
  //   const down = (e: KeyboardEvent) => {
  //     if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
  //       e.preventDefault()
  //       kbar.query.toggle()
  //     }
  //   }
  
  //   document.addEventListener('keydown', down)
  //   return () => document.removeEventListener('keydown', down)
  // }, [])

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner>
          <KBarAnimator>
            <KBarSearch />
            {/* Add more kbar components here */}
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
    </KBarProvider>
  )
}