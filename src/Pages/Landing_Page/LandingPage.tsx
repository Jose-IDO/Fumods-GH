import { useState, useEffect } from 'react'
import styles from './LandingPage.module.css'
import SearchSection from "../../Components/SearchSection/SearchSection"
import DealsSection from '../../Components/DealSection/DealSection'
import LandingSections from "../../Components/LandingSections/LandingSections"
import PopiaOverlay from '../../Components/Popia/PopiaOverlay'
import { usePopia } from '../../contexts/PopiaContext'
import santorini1 from '../../assets/Santorini_1.jpeg'
import santorini2 from '../../assets/Santorini_2.jpg'
import santorini3 from '../../assets/Santorini_3.jpg'
import santorini4 from '../../assets/Santorini_4.jpg'
import coffeecup from '../../assets/coffee_cup.png'
import sofa from '../../assets/sofa.png'
import wifi from '../../assets/wifi-signal.png'
// import blackheart from '../../assets/heart-black.png'

export const LandingPage = () => {
  const [currentImage, setCurrentImage] = useState(0)
  const { isAccepted } = usePopia()
  const images = [santorini1, santorini2, santorini3, santorini4]

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
              style={{ backgroundImage: `url(${img})` }}
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
        <div className={styles.textContent}>
          <div>Welcome to Fumods Guest House.</div>
          <div>Where comfort meets elegance.</div>
          <div>your journey truly, begins with us.</div>
        </div>
      </div>

      <div className={styles.searchsection}> 
        <SearchSection />
      </div>
      <DealsSection/>
      <div className = {styles.section2}>
        <div className = {styles.Head1}> why choose us? </div>
        <div className = {styles.offerings}>

          <div className={styles.offerings1}>
            <img src={coffeecup} alt={'coffee cup image'} style={{height:'150px', width:'150px'}}/>
            <p className={styles.paragraph1}>Enjoy free freshly brewed coffee and a cozy atmosphere all day long. Whether you’re relaxing or working, our coffee shop is the perfect spot to recharge.</p>
          </div>

          <div className={styles.offerings1}>
            <img src={wifi} alt={'wifi icon image'} style={{height:'150px', width:'150px'}}/>
            <p className={styles.paragraph1}>Stay connected wherever you are in the hotel with our fast, free Wi-Fi. Stream, work, or chat without interruptions.</p>
          </div>


          <div className={styles.offerings1}>
            <img src={sofa} alt={'sofa icon image'} style={{height:'150px', width:'150px'}}/>
            <p className={styles.paragraph1}>Experience comfort at its best with fully air-conditioned rooms. Adjust the temperature to your liking and relax in cool comfort.</p>
          </div>

        </div>

      </div>

      {/* ---------- NEW SECTIONS: ADDRESS, EVENTS, FOOTER ---------- */}
      <LandingSections />
    </div>
  )
}
