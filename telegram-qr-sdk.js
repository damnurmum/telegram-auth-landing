/* a local qr helper. demo text goes in; no tg login token comes out */
(function (global) {
  'use strict';

  const QR_SIZE = 280;
  // the transparent image makes qr-code-styling leave its usual 9x9 logo gap
  const TRANSPARENT_LOGO_SPACE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"/>'
  );
  const imageUrls = new WeakMap();

  function randomDemoData() {
    // crypto gives us a new pattern on every reload. the "demo:" bit keeps it harmless.
    const bytes = new Uint8Array(54);
    global.crypto.getRandomValues(bytes);
    const base64 = global.btoa(String.fromCharCode(...bytes));
    return 'demo:' + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function render(image, data = randomDemoData()) {
    if (!(image instanceof global.HTMLImageElement)) {
      throw new TypeError('A target <img> element is required.');
    }
    if (typeof data !== 'string' || !data) {
      throw new TypeError('QR data must be a non-empty string.');
    }
    if (!global.QRCodeStyling) {
      throw new Error('The local QR styling library is unavailable.');
    }

    const qrCode = new global.QRCodeStyling({
      width: QR_SIZE,
      height: QR_SIZE,
      type: 'svg',
      data,
      image: TRANSPARENT_LOGO_SPACE,
      qrOptions: { typeNumber: 5, mode: 'Byte', errorCorrectionLevel: 'L' },
      imageOptions: { imageSize: 1, margin: 0, hideBackgroundDots: true },
      dotsOptions: { color: '#000', type: 'rounded' },
      cornersSquareOptions: { color: '#000', type: 'extra-rounded' },
      backgroundOptions: { color: '#fff' },
    });

    const svgBlob = await qrCode.getRawData('svg');
    if (!(svgBlob instanceof global.Blob)) throw new Error('QR image generation failed.');
    const imageUrl = global.URL.createObjectURL(svgBlob);
    const oldImageUrl = imageUrls.get(image);

    // load it offscreen first. no blank flash while the browser catches up
    await new Promise((resolve, reject) => {
      const preloadImage = new global.Image();
      preloadImage.onload = resolve;
      preloadImage.onerror = () => reject(new Error('The generated QR image could not load.'));
      preloadImage.src = imageUrl;
    }).catch((error) => {
      global.URL.revokeObjectURL(imageUrl);
      throw error;
    });

    image.src = imageUrl;
    imageUrls.set(image, imageUrl);
    if (oldImageUrl) global.URL.revokeObjectURL(oldImageUrl);
    return { data, qr: qrCode };
  }

  global.TelegramQrSDK = Object.freeze({ randomDemoData, render });
})(window);
