import QRCode from 'qrcode';

/**
 * Renders a QR payload string to a PNG data URL. High error correction
 * ('H') keeps the code scannable even when printed small or partially
 * obscured.
 */
export async function renderQrPngDataUrl(payload) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
  });
}

export async function renderQrSvg(payload) {
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
  });
}
