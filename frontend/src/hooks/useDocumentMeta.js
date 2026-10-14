import { useEffect } from 'react'

const BASE_TITLE = 'NutriAI'

function setMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`)
  const previousContent = element?.getAttribute('content')

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)

  return () => {
    if (previousContent === undefined) element.remove()
    else element.setAttribute('content', previousContent)
  }
}

export default function useDocumentMeta({
  title,
  description,
  robots = 'noindex, nofollow',
}) {
  useEffect(() => {
    const previousTitle = document.title
    const restoreDescription = setMeta('description', description)
    const restoreRobots = setMeta('robots', robots)

    document.title = `${title} | ${BASE_TITLE}`

    return () => {
      document.title = previousTitle
      restoreDescription()
      restoreRobots()
    }
  }, [description, robots, title])
}
