import { injectGlobal } from 'emotion'

import futuraMediumWoff2 from '../assets/fonts/FuturaStd-Medium.woff2'
import futuraMediumWoff from '../assets/fonts/FuturaStd-Medium.woff'
import futuraBoldWoff2 from '../assets/fonts/FuturaStd-Bold.woff2'
import futuraBoldWoff from '../assets/fonts/FuturaStd-Bold.woff'
import futuraHeavyWoff2 from '../assets/fonts/FuturaStd-Heavy.woff2'
import futuraHeavyWoff from '../assets/fonts/FuturaStd-Heavy.woff'

import 'react-piano/dist/styles.css'

export default () => injectGlobal`
  #unmute-button {
    display: none;
    top: 70px !important;
  }

  .text-soft {
    color: #999;
  }

  @font-face {
    font-family: 'Futura';
    src: url(${futuraMediumWoff2}) format('woff2'),
      url(${futuraMediumWoff}) format('woff');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'Futura';
    src: url(${futuraBoldWoff2}) format('woff2'),
      url(${futuraBoldWoff}) format('woff');
    font-weight: bold;
    font-style: normal;
  }

  @font-face {
    font-family: 'Futura';
    src: url(${futuraHeavyWoff2}) format('woff2'),
      url(${futuraHeavyWoff}) format('woff');
    font-weight: 600;
    font-style: normal;
  }

  * {
    font-family: "Futura", sans-serif;
    font-display: swap;
  }

  body { 
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
`
