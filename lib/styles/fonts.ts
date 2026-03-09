import localFont from 'next/font/local'

const wagerQuyaSans = localFont({
  src: '../../public/fonts/Wager Quya.ttf',
  display: 'swap',
  variable: '--next-font-sans',
  weight: '400',
  style: 'normal',
})

const mysticDream = localFont({
  src: '../../public/fonts/Mystic Dream.woff2',
  display: 'swap',
  variable: '--font-mystic-dream',
  weight: '400',
  style: 'normal',
})

const helvena = localFont({
  src: '../../public/fonts/Helvena-Regular.woff2',
  display: 'swap',
  variable: '--font-helvena',
  weight: '400',
  style: 'normal',
})

const vank = localFont({
  src: '../../public/fonts/GC Vank.woff2',
  display: 'swap',
  variable: '--font-vank',
  weight: '400',
  style: 'normal',
})

const dripdropAltSolid = localFont({
  src: '../../public/fonts/Dripdrop Alt Solid.ttf',
  display: 'swap',
  variable: '--font-dripdrop-alt-solid',
  weight: '400',
  style: 'normal',
})

const fonts = [wagerQuyaSans, mysticDream, helvena, vank, dripdropAltSolid]
const fontsVariable = fonts.map((font) => font.variable).join(' ')

export { fontsVariable }
