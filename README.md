# Telegram Auth Landing

A front-end clone of the Telegram Web login page: "Log in by QR code" and "Log in by phone number" tabs, country picker, and animations - built entirely with vanilla HTML/CSS/JS, no backend.

Live demo: https://damnurmum.github.io/telegram-auth-landing/

## About

This is a practice/portfolio project - an attempt to reproduce the look and feel of Telegram's real login interface as closely as possible from a screenshot/reference. There is no real authentication, no data is sent to any server, and it does not integrate with the actual Telegram API. It's pure markup and animation work.

## Tech stack

- HTML5 / CSS3
- Vanilla JavaScript
- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) - stylized QR code rendering
- Lottie - animations
- Custom country list and phone number mask (`countries.js`, `phone-format.js`)

## Structure

```
├── index.html                # page markup
├── styles.css                # styles
├── script.js                 # core UI logic
├── countries.js              # country list for the code picker
├── phone-format.js           # phone number input mask
├── qr-code-styling.js        # QR code generation
├── qr-plane-data.js          # data for the "paper plane" animation
├── telegram-qr-sdk.js        # mock SDK for the QR login flow
├── lottie.js                 # Lottie animation engine
└── telegram-logo.svg         # logo
```

## Running locally

All files are static - just open `index.html` in a browser, or serve it with any static server:

```bash
npx serve .
```

## Disclaimer

This project is not affiliated with Telegram and does not collect or transmit any user data. It was built purely for demonstration/learning purposes.
