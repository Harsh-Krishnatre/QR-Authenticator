import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuthFlow } from '../context/AuthFlowContext';

export default function ScanPage() {
  const navigate = useNavigate();
  const { state, savePasskey, resetToEmail } = useAuthFlow();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Requesting camera...');
  const [scanBadge, setScanBadge] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      setError('');
      setStatus('Requesting camera...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setStatus('Point camera at QR code...');
        scanLoop();
      } catch {
        setStatus('Camera unavailable');
        setError('Camera access denied. Please allow camera access and reload this page.');
      }
    }

    function scanLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        handleDetected(code.data);
        return;
      }

      animationRef.current = requestAnimationFrame(scanLoop);
    }

    function stopScanner() {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    function handleDetected(raw) {
      stopScanner();
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }

      const clientId = parsed?.accountId || parsed?.clientId || null;
      if (!clientId) {
        setStatus('QR not recognised');
        setError('This QR code does not match the expected passkey format.');
        timeoutRef.current = window.setTimeout(() => {
          startScanner();
        }, 1200);
        return;
      }

      savePasskey({
        clientId,
        issuer: parsed?.issuer || '',
        label: parsed?.label || '',
      });
      setStatus('QR scanned successfully');
      setScanBadge(`Passkey: ${parsed?.issuer || parsed?.label || clientId}`);
      timeoutRef.current = window.setTimeout(() => {
        navigate('/pattern');
      }, 500);
    }

    startScanner();

    return () => {
      cancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate, savePasskey]);

  function handleBack() {
    resetToEmail();
    navigate('/');
  }

  return (
    <PageLayout
      currentStep={2}
      eyebrow="Step 2"
      title="Scan the passkey from your Auth App."
      description="Only verified users can access this page. The pattern page stays locked until a valid QR is detected and stored in flow state."
      noteTitle="Verified email"
      noteBody={state.email || 'Not set'}
    >
      <div className="page-meta">
        <span className="page-kicker">QR Scan</span>
        <h2>Scan your passkey QR</h2>
        <p className="hint">Open the Auth App, reveal the QR for the correct passkey, and hold it inside the frame. Successful detection routes you to the pattern page.</p>
      </div>

      <div className="step-chip-row">
        <div className="info-chip">
          <span className="chip-label">Verified email</span>
          <span className="chip-value">{state.email}</span>
        </div>
      </div>

      <div className="scanner-wrap">
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        <div className="scan-overlay">
          <div className="scan-corner tl" />
          <div className="scan-corner tr" />
          <div className="scan-corner bl" />
          <div className="scan-corner br" />
          <div className="scan-line" />
        </div>
        <div className={`scan-status ${error ? 'err' : scanBadge ? 'ok' : ''}`}>{status}</div>
      </div>

      {scanBadge ? <div className="badge-success">{scanBadge}</div> : null}
      {error ? <div className="error">{error}</div> : null}

      <div className="page-actions split-actions">
        <button className="btn btn-secondary" type="button" onClick={handleBack}>
          Back to email
        </button>
      </div>
    </PageLayout>
  );
}
