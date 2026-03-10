import { Gloria_Hallelujah } from 'next/font/google'
import localFont from 'next/font/local'

const wagerQuyaSans = localFont({
  src: '../../public/fonts/Wager Quya.ttf',
  display: 'swap',
  variable: '--next-font-sans',
  weight: '400',
  style: 'normal',
})

const mysticDream = localFont({
  src: '../../public/fonts/Agilera.woff',
  display: 'swap',
  variable: '--font-mystic-dream',
  weight: '400',
  style: 'normal',
})

const vank = localFont({
  src: '../../public/fonts/GC Vank.woff2',
  display: 'swap',
  variable: '--font-vank',
  weight: '400',
  style: 'normal',
  preload: false,
})

const dripdropAltSolid = localFont({
  src: '../../public/fonts/Dripdrop Alt Solid.ttf',
  display: 'swap',
  variable: '--font-dripdrop-alt-solid',
  weight: '400',
  style: 'normal',
  preload: false,
})

const gloriaHallelujah = Gloria_Hallelujah({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-gloria-hallelujah',
})

const fonts = [wagerQuyaSans, mysticDream, vank, dripdropAltSolid, gloriaHallelujah]
const fontsVariable = fonts.map((font) => font.variable).join(' ')

export { fontsVariable }
