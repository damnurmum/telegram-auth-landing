// ui copy lives in one place so the language switch stays painless.
const translations = {
  en: {
    title: 'Log in to Telegram by QR Code',
    step1: 'Open Telegram on your phone',
    step2: 'Go to <b>Settings</b> &gt; <b>Devices</b> &gt; <b>Add Device</b>',
    step3: 'Point your phone at this screen to confirm login',
    phoneOption: 'LOG IN BY PHONE NUMBER',
    passkeyOption: 'LOG IN WITH PASSKEY',
    languageOption: 'ПРОДОЛЖИТЬ НА РУССКОМ',
    phoneTitle: 'Telegram',
    phoneDescription: 'Please confirm your country code and enter your phone number.',
    country: 'Country',
    phoneNumber: 'Your phone number',
    keepSignedIn: 'Keep me signed in',
    next: 'NEXT',
    phonePasskey: 'LOG IN WITH PASSKEY',
    phoneLanguage: 'ПРОДОЛЖИТЬ НА РУССКОМ',
    back: 'LOG IN BY QR CODE',
    countries: 'Countries',
    noResults: 'No results',
  },
  ru: {
    title: 'Быстрый вход по QR-коду',
    step1: 'Откройте Telegram с телефона',
    step2: 'Откройте <b>Настройки</b> &gt; <b>Устройства</b> &gt; <b>Подключить устройство</b>',
    step3: 'Для подтверждения направьте камеру телефона на этот экран.',
    phoneOption: 'ВХОД ПО НОМЕРУ ТЕЛЕФОНА',
    passkeyOption: 'ВХОД С КЛЮЧОМ ДОСТУПА',
    languageOption: 'CONTINUE IN ENGLISH',
    phoneTitle: 'Telegram',
    phoneDescription: 'Проверьте код страны и введите свой номер телефона.',
    country: 'Страна',
    phoneNumber: 'Номер телефона',
    keepSignedIn: 'Запомнить меня',
    next: 'ДАЛЕЕ',
    phonePasskey: 'ВОЙТИ С КЛЮЧОМ ДОСТУПА',
    phoneLanguage: 'CONTINUE IN ENGLISH',
    back: 'ВХОД ПО QR-КОДУ',
    countries: 'Страны',
    noResults: 'Ничего не найдено',
  },
};

// country rows are [flag, name, calling code]. the picker and phone field share them
let language = 'en';
const qrScreen = document.querySelector('#qr-screen');
const phoneScreen = document.querySelector('#phone-screen');
const phoneInput = document.querySelector('#phone');
const phoneGroup = document.querySelector('#phone-group');
const countryPicker = document.querySelector('.country-picker');
const countryInput = document.querySelector('#country');
const countryGroup = document.querySelector('#country-group');
const countryMenu = document.querySelector('#country-menu');
const nextButton = document.querySelector('#next-button');
const countries = Array.isArray(window.TELEGRAM_COUNTRIES) ? window.TELEGRAM_COUNTRIES : [];
const qrWrap = document.querySelector('.qr-wrap');
let selectedCountry = countries.find((item) => item[1] === 'Russian Federation') || countries[0];
let visibleCountryIndexes = [];
let activeCountryPosition = -1;
// small screens get the phone form first; desktop has room for the qr intro
const isMobileDevice = navigator.userAgentData?.mobile
  || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const startsWithPhone = window.matchMedia('(max-width: 600px)').matches || isMobileDevice;
let activeScreen = startsWithPhone ? phoneScreen : qrScreen;
let screenTransitionTimer;
let qrAnimation;

if (startsWithPhone) {
  qrScreen.hidden = true;
  phoneScreen.hidden = false;
}

function revealQr() {
  qrWrap.classList.remove('is-loading');
  qrWrap.classList.add('is-revealing');
  qrAnimation?.goToAndPlay(0, true);
  window.setTimeout(() => qrWrap.classList.remove('is-revealing'), 400);
}

function showScreen(next) {
  if (activeScreen === next || screenTransitionTimer) return;
  const previous = activeScreen;
  activeScreen = next;
  next.hidden = false;
  if (next === qrScreen) {
    // the panes scroll separately. reset this one before it fades back in
    next.scrollTop = 0;
    startQrAnimation();
  }
  previous.classList.add('is-exiting');
  next.classList.add('is-entering');

  function finishTransition() {
    if (!screenTransitionTimer) return;
    window.clearTimeout(screenTransitionTimer);
    next.removeEventListener('animationend', onAnimationEnd);
    previous.hidden = true;
    previous.classList.remove('is-exiting');
    next.classList.remove('is-entering');
    screenTransitionTimer = undefined;
    if (next === qrScreen) document.querySelector('#phone-option').focus({ preventScroll: true });
  }

  function onAnimationEnd(event) {
    if (event.target === next && event.animationName === 'screen-fade-in') finishTransition();
  }

  next.addEventListener('animationend', onAnimationEnd);
  screenTransitionTimer = window.setTimeout(finishTransition, 280);
}

function renderLanguage() {
  const messages = translations[language];
  document.documentElement.lang = language;
  document.querySelector('#login-heading').textContent = messages.title;
  document.querySelector('#phone-heading').textContent = messages.phoneTitle;
  document.querySelector('#language-option').textContent = messages.languageOption;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    if (element.dataset.i18n === 'step2') element.innerHTML = messages.step2;
    else element.textContent = messages[element.dataset.i18n];
  });
  countryMenu.setAttribute('aria-label', messages.countries);
}

function toggleLanguage() {
  language = language === 'en' ? 'ru' : 'en';
  renderLanguage();
}

function countryDisplay(item) {
  return item[0] + ' ' + item[1];
}

function renderCountries(query) {
  // 1 search box handles both country names and dialing codes
  const value = query.trim().toLocaleLowerCase();
  const codeQuery = value.replace(/[^\d+]/g, '');
  const hasNumber = /\d/.test(codeQuery);
  countryMenu.replaceChildren();
  visibleCountryIndexes = [];
  activeCountryPosition = -1;
  const fragment = document.createDocumentFragment();

  countries.forEach((item, index) => {
    const matchesName = item[1].toLocaleLowerCase().includes(value);
    const matchesCode = hasNumber && item[2].includes(codeQuery);
    if (value && !matchesName && !matchesCode) return;
    visibleCountryIndexes.push(index);

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'country-row';
    row.id = 'country-option-' + index;
    row.dataset.index = String(index);
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(item === selectedCountry));

    const flag = document.createElement('span');
    flag.className = 'country-flag';
    flag.textContent = item[0];
    const name = document.createElement('span');
    name.className = 'country-name';
    name.textContent = item[1];
    const code = document.createElement('span');
    code.className = 'country-code';
    code.textContent = item[2];
    row.append(flag, name, code);
    fragment.append(row);
  });

  if (!visibleCountryIndexes.length) {
    const empty = document.createElement('div');
    empty.className = 'country-empty';
    empty.textContent = translations[language].noResults;
    fragment.append(empty);
  }
  countryMenu.append(fragment);
  countryMenu.scrollTop = 0;
}

function openCountryMenu(query = '') {
  renderCountries(query);
  countryPicker.classList.add('open');
  countryMenu.classList.add('open');
  countryInput.setAttribute('aria-expanded', 'true');
}

function closeCountryMenu(restore = true) {
  countryPicker.classList.remove('open');
  countryMenu.classList.remove('open');
  countryInput.setAttribute('aria-expanded', 'false');
  countryInput.removeAttribute('aria-activedescendant');
  if (restore && selectedCountry) countryInput.value = countryDisplay(selectedCountry);
  countryGroup.classList.toggle('touched', Boolean(countryInput.value));
}

function setActiveCountry(position) {
  if (!visibleCountryIndexes.length) return;
  activeCountryPosition = (position + visibleCountryIndexes.length) % visibleCountryIndexes.length;
  countryMenu.querySelectorAll('.country-row.is-active').forEach((row) => row.classList.remove('is-active'));
  const row = document.querySelector('#country-option-' + visibleCountryIndexes[activeCountryPosition]);
  row.classList.add('is-active');
  row.scrollIntoView({ block: 'nearest' });
  countryInput.setAttribute('aria-activedescendant', row.id);
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw.includes('+') ? '+' : '';
  const international = '+' + digits;
  if (window.libphonenumber && window.libphonenumber.AsYouType) {
    return new window.libphonenumber.AsYouType().input(international);
  }
  return international;
}

function countryIso(flag) {
  const symbols = Array.from(flag);
  if (symbols.length !== 2) return '';
  const codes = symbols.map((symbol) => symbol.codePointAt(0));
  if (!codes.every((code) => code >= 0x1f1e6 && code <= 0x1f1ff)) return '';
  return String.fromCharCode(...codes.map((code) => code - 0x1f1e6 + 65));
}

function updateCountryFromPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return;
  let match;
  if (window.libphonenumber && window.libphonenumber.AsYouType) {
    const formatter = new window.libphonenumber.AsYouType();
    formatter.input(value);
    const iso = formatter.getCountry();
    if (iso) match = countries.find((item) => countryIso(item[0]) === iso);
  }
  if (!match) {
    // some entries share a calling code, so keep the current pick if it still fits
    const selectedCode = selectedCountry && selectedCountry[2].replace(/\D/g, '');
    if (selectedCode && digits.startsWith(selectedCode)) return;
    match = countries
      .filter((item) => digits.startsWith(item[2].replace(/\D/g, '')))
      .sort((a, b) => b[2].length - a[2].length)[0];
  }
  if (match && match !== selectedCountry) {
    selectedCountry = match;
    countryInput.value = countryDisplay(match);
    countryGroup.classList.add('touched');
  }
}

function updateNextButton() {
  // preview only: next appears after seven digits and never starts a login
  nextButton.hidden = phoneInput.value.replace(/\D/g, '').length < 7;
}

function chooseCountry(item) {
  if (!item) return;
  const changed = item !== selectedCountry;
  selectedCountry = item;
  countryInput.value = countryDisplay(item);
  if (changed || !phoneInput.value.trim()) phoneInput.value = item[2] + ' ';
  phoneGroup.classList.add('touched');
  updateNextButton();
  closeCountryMenu(false);
  phoneInput.focus();
  phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
}

countryInput.addEventListener('focus', () => {
  countryInput.select();
  openCountryMenu();
});

countryInput.addEventListener('input', () => {
  countryGroup.classList.toggle('touched', Boolean(countryInput.value));
  openCountryMenu(countryInput.value);
});

countryInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!countryMenu.classList.contains('open')) openCountryMenu();
    setActiveCountry(activeCountryPosition + (event.key === 'ArrowDown' ? 1 : -1));
  } else if (event.key === 'Enter' && countryMenu.classList.contains('open')) {
    event.preventDefault();
    if (activeCountryPosition >= 0) chooseCountry(countries[visibleCountryIndexes[activeCountryPosition]]);
    else if (visibleCountryIndexes.length === 1) chooseCountry(countries[visibleCountryIndexes[0]]);
    else closeCountryMenu();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeCountryMenu();
    countryInput.blur();
  }
});

countryMenu.addEventListener('click', (event) => {
  const row = event.target.closest('.country-row');
  if (row) chooseCountry(countries[Number(row.dataset.index)]);
});

document.addEventListener('pointerdown', (event) => {
  if (!countryPicker.contains(event.target)) closeCountryMenu();
});

phoneInput.addEventListener('input', () => {
  const previous = phoneInput.value;
  const caret = phoneInput.selectionStart ?? previous.length;
  // keep the caret on the same digit while asyoutype shuffles the spaces around
  const digitsBeforeCaret = previous.slice(0, caret).replace(/\D/g, '').length;
  const formatted = formatPhone(previous);
  phoneInput.value = formatted;
  let newCaret = formatted.length;
  if (digitsBeforeCaret === 0) newCaret = formatted.startsWith('+') ? 1 : 0;
  else {
    let count = 0;
    for (let index = 0; index < formatted.length; index++) {
      if (/\d/.test(formatted[index])) count++;
      if (count === digitsBeforeCaret) {
        newCaret = index + 1;
        break;
      }
    }
  }
  phoneInput.setSelectionRange(newCaret, newCaret);
  phoneGroup.classList.toggle('touched', Boolean(phoneInput.value));
  updateCountryFromPhone(formatted);
  updateNextButton();
});

phoneInput.addEventListener('blur', () => {
  phoneGroup.classList.toggle('touched', Boolean(phoneInput.value));
});

document.querySelector('#language-option').addEventListener('click', () => {
  toggleLanguage();
});

document.querySelector('#phone-option').addEventListener('click', () => {
  showScreen(phoneScreen);
});

document.querySelector('#back-button').addEventListener('click', () => {
  closeCountryMenu();
  showScreen(qrScreen);
});

document.querySelector('#phone-language').addEventListener('click', () => {
  toggleLanguage();
});

document.querySelector('#phone-form').addEventListener('submit', (event) => {
  // yup, still a visual demo. no auth request goes out from this form
  event.preventDefault();
});

document.querySelectorAll('.actions button, .back-button, .phone-text-button, .next-button').forEach((button) => {
  // ripple on tap/click, shared by the text buttons
  button.addEventListener('pointerdown', (event) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'button-ripple';
    ripple.style.left = event.clientX - rect.left + 'px';
    ripple.style.top = event.clientY - rect.top + 'px';
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    button.append(ripple);
  });
});

function startQrAnimation() {
  if (qrAnimation || !window.lottie || !window.TELEGRAM_QR_ANIMATION) return;
  try {
    const container = document.querySelector('#qr-logo');
    qrAnimation = window.lottie.loadAnimation({
      container,
      renderer: 'canvas',
      loop: true,
      autoplay: true,
      animationData: window.TELEGRAM_QR_ANIMATION,
      rendererSettings: { dpr: 2, clearCanvas: true },
    });
    qrAnimation.addEventListener('DOMLoaded', () => container.classList.add('lottie-ready'));
    if (container.querySelector('canvas')) container.classList.add('lottie-ready');
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) qrAnimation.pause();
      else qrAnimation.play();
    });
  } catch {
    // lottie had a bad day; the svg plane still looks fine. эпл контора пидорасов тоже
  }
}

// boot the page. the qr data is random, local, and useless for signing in xD
renderLanguage();
updateNextButton();
if (activeScreen === qrScreen) startQrAnimation();

if (window.TelegramQrSDK) {
  const qrData = window.TelegramQrSDK.randomDemoData();
  window.TelegramQrSDK.render(document.querySelector('#qr-code'), qrData)
    .then(() => {
      if (activeScreen === qrScreen) revealQr();
      else qrWrap.classList.remove('is-loading');
    })
    .catch(() => {
      // leave the logo visible even if this browser cant generate the qr
      qrWrap.classList.remove('is-loading');
    });
} else {
  qrWrap.classList.remove('is-loading');
}
