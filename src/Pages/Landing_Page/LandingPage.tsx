import { useState, useEffect } from 'react'
import styles from './LandingPage.module.css'
import DealsSection from '../../Components/DealSection/DealSection'
import LandingSections from "../../Components/LandingSections/LandingSections"
import PopiaOverlay from '../../Components/Popia/PopiaOverlay'
import { usePopia } from '../../contexts/PopiaContext'
import coffeecup from '../../assets/coffee_cup.png'
import wifi from '../../assets/wifi-signal.png'
import neighbourhood from '../../assets/amenities/quiet-neighbourhood.svg'
import localAmenities from '../../assets/amenities/shopping-and-hospital.svg'
// import blackheart from '../../assets/heart-black.png'

const images = Object.entries(import.meta.glob<string>(
  '../../assets/guest-house/*.{png,jpg,jpeg,webp}',
  { eager: true, import: 'default' },
)).filter(([path]) => !path.endsWith('/WhatsApp Image 2026-11-06 at 10.08.16.jpeg'))
  .map(([, image]) => image)

export const LandingPage = () => {
  const [currentImage, setCurrentImage] = useState(0)
  const { isAccepted } = usePopia()

  const nextImage = () => {
    if (!isAccepted) return
    setCurrentImage(current => current === images.length - 1 ? 0 : current + 1)
  }

  const prevImage = () => {
    if (!isAccepted) return
    setCurrentImage(current => current === 0 ? images.length - 1 : current - 1)
  }

  useEffect(() => {
    if (!isAccepted) return
    const timer = setInterval(() => {
      setCurrentImage(current => current === images.length - 1 ? 0 : current + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [isAccepted, images.length])

  return (
    <div>
      <PopiaOverlay />
      <div className={styles.sectionone}>
        <div className={styles.slideContainer} style={{ transform: `translateX(-${currentImage * 100}%)` }}>
          {images.map((img, index) => (
            <div
              key={index}
              className={styles.slide}
              style={{ backgroundImage: `url("${img}")` }}
            />
          ))}
        </div>
        <button 
          onClick={prevImage} 
          className={styles.sliderButton + ' ' + styles.leftButton}
          disabled={!isAccepted}
          style={{ opacity: isAccepted ? 1 : 0.5, cursor: isAccepted ? 'pointer' : 'not-allowed' }}
        >
          &lt;
        </button>
        <button 
          onClick={nextImage} 
          className={styles.sliderButton + ' ' + styles.rightButton}
          disabled={!isAccepted}
          style={{ opacity: isAccepted ? 1 : 0.5, cursor: isAccepted ? 'pointer' : 'not-allowed' }}
        >
          &gt;
        </button>
      </div>

      <DealsSection/>
      <section className={styles.section2} aria-labelledby="why-choose-us">
        <h2 id="why-choose-us" className={styles.Head1}>Why choose us?</h2>
        <div className = {styles.offerings}>

          <div className={styles.offerings1}>
            <img src={coffeecup} alt="Coffee cup" loading="lazy" />
            <h3>Platō Coffee nearby</h3>
            <p className={styles.paragraph1}>Start your morning at Platō Coffee Garsfontein, at 649 Borzoi Street. Enjoy a coffee on the same street as Fumods before heading out to explore Pretoria East.</p>
            <a className={styles.amenityLink} href="https://plato.coffee/" target="_blank" rel="noopener noreferrer">Discover Platō Coffee</a>
          </div>

          <div className={styles.offerings1}>
            <img src={wifi} alt="Wi-Fi connection" loading="lazy" />
            <h3>Stay connected</h3>
            <p className={styles.paragraph1}>Stay connected wherever you are in the hotel with our fast, free Wi-Fi. Stream, work, or chat without interruptions.</p>
          </div>

          <div className={styles.offerings1}>
            <img src={neighbourhood} alt="Illustration of a peaceful residential home, trees and a security shield" loading="lazy" />
            <h3>A quiet, safe neighbourhood</h3>
            <p className={styles.paragraph1}>Unwind in Garsfontein’s peaceful residential surroundings. Our quiet neighbourhood offers a welcoming base for business trips, family visits and a relaxing break in Pretoria.</p>
          </div>

          <div className={styles.offerings1}>
            <img src={localAmenities} alt="Illustration of a shopping centre and hospital" loading="lazy" />
            <h3>Shopping &amp; healthcare nearby</h3>
            <p className={styles.paragraph1}>Visit Woodlands Boulevard or Menlyn Park for shopping and dining. Netcare Pretoria East Hospital is also in the area, making Fumods a convenient base for appointments or visiting loved ones.</p>
            <div className={styles.amenityLinks}>
              <a className={styles.amenityLink} href="https://www.woodlandsboulevard.co.za/" target="_blank" rel="noopener noreferrer">Woodlands</a>
              <a className={styles.amenityLink} href="https://www.menlynpark.co.za/" target="_blank" rel="noopener noreferrer">Menlyn Park</a>
              <a className={styles.amenityLink} href="https://www.netcare.co.za/netcare-facilities/netcare-pretoria-east-hospital/1000" target="_blank" rel="noopener noreferrer">Hospital</a>
            </div>
          </div>
        </div>

      </section>

      {/* ---------- NEW SECTIONS: ADDRESS, EVENTS, FOOTER ---------- */}
      <LandingSections />
    </div>
  )
}
