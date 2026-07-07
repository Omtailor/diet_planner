import { useState, useEffect, useRef } from 'react'

export default function useMealAutoplay(initialSlot = 0) {
  const [activeSlot, setActiveSlot] = useState(0)
  const [displaySlotLocal, setDisplaySlotLocal] = useState(initialSlot)
  const [cardVisible, setCardVisible] = useState(true)
  const autoPlayRef = useRef(null)
  const transitioningRef = useRef(false)

  const switchSlot = (i) => {
    if (transitioningRef.current || i === displaySlotLocal) return
    transitioningRef.current = true
    setCardVisible(false) // fade out
    setTimeout(() => {
      setDisplaySlotLocal(i)
      setActiveSlot(i)
      setCardVisible(true) // fade in
      transitioningRef.current = false
    }, 280) // matches transition duration
  }

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveSlot(prev => {
        const next = (prev + 1) % 3
        switchSlot(next)
        return prev // actual update happens inside switchSlot
      })
    }, 3000)
    return () => clearInterval(autoPlayRef.current)
  }, [displaySlotLocal])

  const handleSlotChange = (i) => {
    clearInterval(autoPlayRef.current)
    switchSlot(i)
    autoPlayRef.current = setInterval(() => {
      setActiveSlot(prev => {
        const next = (prev + 1) % 3
        switchSlot(next)
        return prev
      })
    }, 3000)
  }

  return {
    activeSlot,
    displaySlot: displaySlotLocal,
    cardVisible,
    handleSlotChange,
    switchSlot,
    setDisplaySlot: setDisplaySlotLocal,
  }
}
