import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const scannerElementId = 'visitor-pass-qr-reader';

function QrScanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render(
      (decodedText) => onScan(decodedText),
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  return <div id={scannerElementId} className="qr-reader" />;
}

export default QrScanner;
