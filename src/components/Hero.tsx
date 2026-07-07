import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import './Hero.css'

import img1 from '../public/bowl.jpg'
import img2 from '../public/camera.jpg'
import img3 from '../public/cigs.jpg'
import img4 from '../public/coke-drink.jpg'
import img5 from '../public/casetteplayer.jpg'
import img6 from '../public/cup.jpg'
import img7 from '../public/knives.jpg'
import img8 from '../public/phone.jpg'
import img9 from '../public/shirt.jpg'
import img10 from '../public/stanleycup.jpg'
import img11 from '../public/toothbrush.jpg'

const IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11]

interface HeroProps {
  search: string
  onSearchChange: (value: string) => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (cat: string) => void
}

function Hero({ search, onSearchChange, categories, selectedCategory, onCategoryChange }: HeroProps) {
  const [baseIdx, setBaseIdx] = useState(0)
  const [overlayIdx, setOverlayIdx] = useState(1)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setBaseIdx(i => (i + 1) % IMAGES.length)
        setOverlayIdx(i => (i + 1) % IMAGES.length)
        setFading(false)
      }, 1400)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <section className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.38)),url(${IMAGES[baseIdx]})` }}
        />
        <div
          className="hero-bg"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.38)),url(${IMAGES[overlayIdx]})`,
            opacity: fading ? 1 : 0,
            transition: fading ? 'opacity 1.4s ease-in-out' : 'none',
          }}
        />
        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">Velvet Hive</h1>
            <p className="hero-tagline">Everything you need, curated with care.</p>
          </div>
          <div className="hero-search-wrap input-wrap">
            <span className="input-icon"><Search size={16} /></span>
            <input
              className="input"
              type="text"
              placeholder="Search for products, brands, categories..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="hero-cats">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-pill${selectedCategory === cat ? ' active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </>
  )
}

export default Hero
