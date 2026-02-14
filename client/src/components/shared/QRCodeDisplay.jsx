import { QRCodeSVG } from 'qrcode.react';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ data, size = 256 }) => {
  return (
    <div className="qr-code-container">
      <div className="qr-code-wrapper">
        <QRCodeSVG value={JSON.stringify(data)} size={size} level="H" />
      </div>
    </div>
  );
};

export default QRCodeDisplay;
