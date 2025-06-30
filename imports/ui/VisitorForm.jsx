// React form with fields: name, company, email, purpose
// On submit, call Meteor method 'visitors.checkIn'
// Show success or duplicate message

import React, { useState, useRef, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

// ...styles from your original code...
const cardStyle = {
  maxWidth: '400px',
  margin: '40px auto',
  padding: '32px',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  margin: '10px 0',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '16px',
  outline: 'none',
  transition: 'border 0.2s',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(90deg, #007cf0 0%, #00dfd8 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '16px',
  cursor: 'pointer',
  marginTop: '16px',
  transition: 'background 0.2s, transform 0.2s',
};

const messageStyle = (success) => ({
  color: success ? '#0a8d4b' : '#d32f2f',
  background: success ? '#e6f9f0' : '#fdeaea',
  borderRadius: '8px',
  padding: '10px',
  marginTop: '18px',
  width: '100%',
  textAlign: 'center',
  fontWeight: '500',
  fontSize: '15px',
});

const welcomeContainerStyle = {
  minHeight: '100vh',
  width: '100vw',
  background: 'linear-gradient(180deg, #1f2937 0%, #23272f 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 10,
  overflow: 'hidden',
};

const hospitalImgStyle = {
  width: 220,
  height: 220,
  objectFit: 'cover',
  borderRadius: '50%',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
  marginBottom: 32,
  animation: 'popIn 1s cubic-bezier(.68,-0.55,.27,1.55)',
};

const welcomeTitleStyle = {
  color: '#fff',
  fontWeight: 800,
  fontSize: 38,
  marginBottom: 8,
  letterSpacing: 1,
  textAlign: 'center',
  animation: 'fadeInUp 1.2s 0.2s both',
};

const welcomeDescStyle = {
  color: '#b2ebf2',
  fontSize: 20,
  marginBottom: 36,
  textAlign: 'center',
  fontWeight: 500,
  lineHeight: 1.5,
  animation: 'fadeInUp 1.2s 0.4s both',
};

const checkBtnStyle = {
  ...buttonStyle,
  width: 220,
  fontSize: 20,
  fontWeight: 700,
  borderRadius: 12,
  marginTop: 0,
  marginBottom: 0,
  background: 'linear-gradient(90deg, #00bcd4 0%, #2196f3 100%)',
  boxShadow: '0 4px 16px 0 rgba(33,150,243,0.18)',
  animation: 'fadeInUp 1.2s 0.6s both',
};

function extractVisitorFields(ocrText) {
  const lines = ocrText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  let name = '';
  let company = '';
  let email = '';
  let phone = '';
  let dob = '';

  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  // Phone regex: matches numbers with optional +, (), -, spaces, at least 7 digits
  const phoneRegex = /(\+?\d[\d\s\-().]{6,}\d)/;
  // Company keywords
  const companyKeywords = [
    'Hospital', 'Clinic', 'Labs', 'Inc', 'Ltd', 'Corporation', 'LLC'
  ];
  // Date of birth regex: matches DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
  const dobRegex = /\b(?:DOB|D\.O\.B\.|Date of Birth)[:\s\-]*((?:\d{2}[\/\-\.]){2}\d{2,4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})\b/i;
  const dateRegex = /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})\b/;

  // Find email and phone first
  for (const line of lines) {
    if (!email && emailRegex.test(line)) {
      email = line.match(emailRegex)[0];
    }
    if (!phone && phoneRegex.test(line.replace(/\s+/g, ''))) {
      phone = line.match(phoneRegex)[0].replace(/[^\d+]/g, '');
    }
    // Find DOB with label
    if (!dob && dobRegex.test(line)) {
      dob = dobRegex.exec(line)[1];
    }
  }

  // If not found, look for a standalone date near a DOB label or in the first few lines
  if (!dob) {
    for (let i = 0; i < lines.length; i++) {
      if (
        /dob|d\.o\.b\.|date of birth/i.test(lines[i]) &&
        i + 1 < lines.length &&
        dateRegex.test(lines[i + 1])
      ) {
        dob = dateRegex.exec(lines[i + 1])[1];
        break;
      }
      // Sometimes date is on the same line without label
      if (!dob && dateRegex.test(lines[i])) {
        dob = dateRegex.exec(lines[i])[1];
      }
    }
  }

  // Find company
  for (const line of lines) {
    if (
      companyKeywords.some(word =>
        line.toLowerCase().includes(word.toLowerCase())
      )
    ) {
      company = line;
      break;
    }
  }

  // Find name: look for a line with 2+ capitalized words, not containing company/email/phone
  for (const line of lines) {
    if (
      !name &&
      /^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/.test(line) && // "First Last" or "First Middle Last"
      !line.toLowerCase().includes('hospital') &&
      !line.toLowerCase().includes('clinic') &&
      !line.toLowerCase().includes('labs') &&
      !emailRegex.test(line) &&
      !phoneRegex.test(line)
    ) {
      name = line;
      break;
    }
  }

  // Fallback: try to find any line with 2+ words, mostly letters, not company/email/phone
  if (!name) {
    for (const line of lines) {
      if (
        line.split(' ').length >= 2 &&
        /^[A-Za-z .'-]+$/.test(line) &&
        !companyKeywords.some(word => line.toLowerCase().includes(word.toLowerCase())) &&
        !emailRegex.test(line) &&
        !phoneRegex.test(line)
      ) {
        name = line
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      }
    }
  }

  return { name, company, email, phone, dob };
}

const VisitorForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    purpose: '',
    phone: '',
    dob: '',
    gender: '',
  });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate all fields and email format
  const validateForm = () => {
    if (
      !formData.name ||
      !formData.company ||
      !formData.email ||
      !formData.purpose ||
      !formData.phone ||
      !formData.gender
    ) {
      setMessage('All required fields must be filled.');
      setSuccess(false);
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address.');
      setSuccess(false);
      return false;
    }
    setMessage('');
    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage('');
    Meteor.call('visitors.checkIn', formData, (error, result) => {
      setLoading(false);
      if (error) {
        setMessage('Check-in failed.');
        setSuccess(false);
      } else {
        if (result.status === 'duplicate') {
          setMessage('Duplicate entry. Visitor already exists.');
          setSuccess(false);
        } else {
          setMessage('Visitor successfully checked in!');
          setSuccess(true);
          setFormData({ name: '', company: '', email: '', purpose: '', phone: '', dob: '', gender: '' });
          setShowSuccessScreen(true);
        }
      }
    });
  };

  // Handle Scan ID button click
  const handleScanIdClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  // Handle file input change and OCR
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    setMessage('');
    try {
      // Replace with Meteor OCR call if needed
      // For now, just simulate
      setTimeout(() => {
        // Simulate OCR result
        const ocrText = "John Doe\nAcme Hospital\njohn.doe@email.com\n+1 555-123-4567\nDOB: 1990-01-01";
        const { name, company, email, phone, dob } = extractVisitorFields(ocrText);
        setFormData(prev => ({
          ...prev,
          name: name || prev.name,
          company: company || prev.company,
          email: email || prev.email,
          phone: phone || prev.phone,
          dob: dob || prev.dob,
        }));
        setMessage('ID scanned! Please verify and complete the form.');
        setSuccess(true);
        setOcrLoading(false);
      }, 1500);
    } catch (err) {
      setMessage('Failed to scan ID. Please try again.');
      setSuccess(false);
      setOcrLoading(false);
    }
  };

  // Open webcam and show video preview
  const handleOpenCamera = async () => {
    setMessage('');
    setSuccess(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setMessage('Unable to access camera.');
      setSuccess(false);
    }
  };

  // Capture frame from video and send to Meteor for OCR
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShowCamera(false);
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setOcrLoading(true);
    setMessage('');
    try {
      const dataUrl = canvas.toDataURL('image/png');
      // Send base64 image to Meteor method for Google Vision OCR
      Meteor.call('visitors.processOCRWithOpenAI', dataUrl, (error, result) => {
        setOcrLoading(false);
        const resultText = result?.text || '';
        if (error || !resultText) {
          setMessage('Failed to scan ID from camera. Please try again.');
          setSuccess(false);
          return;
        }
        console.log('OCR raw result:', result.text);

        // CLEAN the GPT response
        let cleanedText = result.text.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        }

        console.log('Cleaned OCR JSON:', cleanedText);

        let fields;
        try {
          fields = JSON.parse(cleanedText);
        } catch (err) {
          console.error('Error parsing OCR JSON:', err, cleanedText);
          setMessage('Failed to parse OCR result. Please try again.');
          setSuccess(false);
          return;
        }

        console.log('Parsed OCR fields:', fields);
        setFormData(prev => {
          const updated = { ...prev };
          if (fields.name) updated.name = fields.name;
          if (fields.company) updated.company = fields.company;
          if (fields.email) updated.email = fields.email;
          if (fields.phone) updated.phone = fields.phone;
          if (fields.dob) updated.dob = fields.dob;
          return updated;
        });
        setMessage('ID scanned from camera! Please verify and complete the form.');
        setSuccess(true);
      });
    } catch (err) {
      setOcrLoading(false);
      setMessage('Failed to scan ID from camera. Please try again.');
      setSuccess(false);
    }
  };

  // Animation for form entrance
  const [formVisible, setFormVisible] = useState(false);
  useEffect(() => {
    if (!showWelcome) {
      setTimeout(() => setFormVisible(true), 100);
    }
  }, [showWelcome]);

  // Camera overlay component
  const ID_BOX_WIDTH = 260;
  const ID_BOX_HEIGHT = 160;
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [idBoxAligned, setIdBoxAligned] = useState(false);
  const [holdTimer, setHoldTimer] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Open camera overlay
  const handleOpenCameraOverlay = async () => {
    setShowCameraOverlay(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
    } catch (e) {
      alert('Camera access denied.');
      setShowCameraOverlay(false);
    }
  };

  // Attach stream to video
  useEffect(() => {
    if (showCameraOverlay && videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play();
    }
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraOverlay, videoStream]);

  // Detection logic + auto-capture
  useEffect(() => {
    let interval;
    let timer = holdTimer;
    if (showCameraOverlay && videoRef.current && canvasRef.current) {
      interval = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (
          !video ||
          !canvas ||
          !video.videoWidth ||
          !video.videoHeight ||
          video.readyState < 2
        ) {
          setIdBoxAligned(false);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data from the box region
        const boxX = (canvas.width - ID_BOX_WIDTH) / 2;
        const boxY = (canvas.height - ID_BOX_HEIGHT) / 2;
        let imageData;
        try {
          imageData = ctx.getImageData(boxX, boxY, ID_BOX_WIDTH, ID_BOX_HEIGHT);
        } catch {
          setIdBoxAligned(false);
          return;
        }

        // Simple contrast detection
        let sum = 0,
          sumSq = 0,
          count = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          const brightness =
            (imageData.data[i] +
              imageData.data[i + 1] +
              imageData.data[i + 2]) /
            3;
          sum += brightness;
          sumSq += brightness * brightness;
          count++;
        }
        const mean = sum / count;
        const variance = sumSq / count - mean * mean;
        const stddev = Math.sqrt(variance);

        const aligned = stddev > 28;
        setIdBoxAligned(aligned);

        // Auto-capture logic
        if (aligned && !timer && !capturedImage) {
          timer = setTimeout(() => {
            // Capture image from the box region
            const captureCanvas = document.createElement('canvas');
            captureCanvas.width = ID_BOX_WIDTH;
            captureCanvas.height = ID_BOX_HEIGHT;
            const captureCtx = captureCanvas.getContext('2d');
            captureCtx.drawImage(
              video,
              boxX,
              boxY,
              ID_BOX_WIDTH,
              ID_BOX_HEIGHT,
              0,
              0,
              ID_BOX_WIDTH,
              ID_BOX_HEIGHT
            );
            const dataUrl = captureCanvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            setShowCameraOverlay(false);
            setIdBoxAligned(false);
            setHoldTimer(null);
          }, 3000); // 3 seconds
          setHoldTimer(timer);
        } else if (!aligned && timer) {
          clearTimeout(timer);
          setHoldTimer(null);
        }
      }, 350);
    }
    return () => {
      clearInterval(interval);
      if (holdTimer) clearTimeout(holdTimer);
    };
    // eslint-disable-next-line
  }, [showCameraOverlay, capturedImage]);

  // Reset timer if alignment lost
  useEffect(() => {
    if (!idBoxAligned && holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    // eslint-disable-next-line
  }, [idBoxAligned]);

  // Add state for Google Vision text detection
  const [mainIdBoxAligned, setMainIdBoxAligned] = useState(false);
  const [mainHoldTimer, setMainHoldTimer] = useState(null);
  const [mainOcrChecking, setMainOcrChecking] = useState(false);

  // Google Vision-based detection for ID card (text presence)
  useEffect(() => {
    let interval;
    let timer = mainHoldTimer;
    if (showCamera && videoRef.current && canvasRef.current) {
      interval = setInterval(() => {
        if (mainOcrChecking) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
          setMainIdBoxAligned(false);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const boxX = (canvas.width - ID_BOX_WIDTH) / 2;
        const boxY = (canvas.height - ID_BOX_HEIGHT) / 2;
        // Grab the box region as a data URL
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = ID_BOX_WIDTH;
        tempCanvas.height = ID_BOX_HEIGHT;
        tempCanvas.getContext('2d').drawImage(
          video,
          boxX,
          boxY,
          ID_BOX_WIDTH,
          ID_BOX_HEIGHT,
          0,
          0,
          ID_BOX_WIDTH,
          ID_BOX_HEIGHT
        );
        const dataUrl = tempCanvas.toDataURL('image/png');
        setMainOcrChecking(true);
        Meteor.call('visitors.processOCRWithOpenAI', dataUrl, (error, result) => {
          setMainOcrChecking(false);
          const resultText = result?.text || '';
          // Only align if text is detected (at least 8 non-space chars)
          const aligned = resultText && resultText.replace(/\s/g, '').length > 8;
          setMainIdBoxAligned(aligned);
          if (aligned && !timer) {
            timer = setTimeout(() => {
              const modal = document.querySelector('[style*="z-index: 1000"]');
              if (modal) {
                const captureBtn = Array.from(modal.querySelectorAll('button')).find(
                  btn => btn.textContent && btn.textContent.toLowerCase().includes('capture') && !btn.disabled
                );
                if (captureBtn) captureBtn.click();
              }
              setMainHoldTimer(null);
            }, 3000);
            setMainHoldTimer(timer);
          } else if (!aligned && timer) {
            clearTimeout(timer);
            setMainHoldTimer(null);
          }
        });
      }, 1200); // check every 1.2s to avoid API spam
    }
    return () => {
      clearInterval(interval);
      if (mainHoldTimer) clearTimeout(mainHoldTimer);
    };
    // eslint-disable-next-line
  }, [showCamera]);

  useEffect(() => {
    if (!mainIdBoxAligned && mainHoldTimer) {
      clearTimeout(mainHoldTimer);
      setMainHoldTimer(null);
    }
    // eslint-disable-next-line
  }, [mainIdBoxAligned]);

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #1f2937 0%, #23272f 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0,
    }}>
      {/* Welcome Page */}
      {showWelcome && (
        <div style={welcomeContainerStyle}>
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
            alt="Hospital"
            style={hospitalImgStyle}
          />
          <h1 style={welcomeTitleStyle}>Welcome to <span style={{ color: '#00bcd4' }}>MIE</span></h1>
          <div style={welcomeDescStyle}>
            Your health and safety are our priority.<br />
            Please check in to continue.
          </div>
          <button
            style={checkBtnStyle}
            onClick={() => setShowWelcome(false)}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Check In Now
          </button>
          {/* Subtle floating animation */}
          <style>{`
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.7);}
              80% { opacity: 1; transform: scale(1.05);}
              100% { opacity: 1; transform: scale(1);}
            }
            @keyframes fadeInUp {
              0% { opacity: 0; transform: translateY(40px);}
              100% { opacity: 1; transform: translateY(0);}
            }
          `}</style>
        </div>
      )}

      {/* Main Form */}
      {!showWelcome && (
        <div
          style={{
            ...cardStyle,
            zIndex: 2,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            background: 'black',
            border: '1px solid rgb(56, 3, 54)',
            backdropFilter: 'blur(6px)',
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.7s cubic-bezier(.68,-0.55,.27,1.55), transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
          }}
        >
          {showSuccessScreen ? (
            <div style={{
              zIndex: 2,
              maxWidth: 480,
              width: '100%',
              margin: '0 auto',
              padding: '48px 32px',
              background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
              borderRadius: 24,
              boxShadow: '0 8px 40px 0 rgba(33, 150, 243, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 340,
            }}>
              <span style={{ fontSize: 72, marginBottom: 24 }} role="img" aria-label="hospital">🏥</span>
              <h1 style={{ color: '#007cf0', fontWeight: 800, fontSize: 36, margin: 0, textAlign: 'center', letterSpacing: 1 }}>Check-In Successful!</h1>
              <p style={{ color: '#00838f', fontSize: 20, margin: '24px 0 0 0', textAlign: 'center', fontWeight: 500, lineHeight: 1.5 }}>
                Thank you for checking in.<br />
                Please wait to be called or assisted by our staff.<br />
                <span style={{ fontSize: 28, display: 'block', marginTop: 16 }}>Have a healthy day!</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 8 }} autoComplete="off">
              {/* Full Name */}
              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  background: '#23272f',
                  color: '#f8fafc',
                  border: 'None',
                  fontSize: 17,
                  marginBottom: 16,
                  boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  height: '48px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.border = '2px solid #2196f3'}
                onBlur={e => e.target.style.border = '2px solid #00bcd4'}
                required
              />
              {/* Company */}
              <input
                name="company"
                placeholder="Company / Organization"
                value={formData.company}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  background: '#23272f',
                  color: '#f8fafc',
                  border: 'None',
                  fontSize: 17,
                  marginBottom: 16,
                  boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  height: '48px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.border = '2px solid #2196f3'}
                onBlur={e => e.target.style.border = '2px solid #00bcd4'}
                required
              />
              {/* Email */}
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  background: '#23272f',
                  color: '#f8fafc',
                  border: 'None',
                  fontSize: 17,
                  marginBottom: 16,
                  boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  height: '48px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.border = '2px solid #2196f3'}
                onBlur={e => e.target.style.border = '2px solid #00bcd4'}
                required
              />
              {/* Purpose of Visit Dropdown */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    background: '#23272f',
                    color: '#f8fafc',
                    border: 'none',
                    fontSize: 17,
                    marginBottom: 0,
                    boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                    transition: 'border 0.2s, box-shadow 0.2s',
                    appearance: 'none',
                    height: '48px',
                    padding: '12px',
                    paddingRight: '40px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.border = '2px solid #2196f3'}
                  onBlur={e => e.target.style.border = '2px solid #00bcd4'}
                  required
                >
                  <option value="" disabled>Select Purpose of Visit</option>
                  <option value="General Check-up">General Check-up</option>
                  <option value="Test">Test</option>
                  <option value="Doctor meeting">Doctor meeting</option>
                  <option value="Basic check">Basic check</option>
                  <option value="Out patient">Out patient</option>
                </select>
                <span style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#00bcd4',
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              {/* Phone Number */}
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  background: '#23272f',
                  color: '#f8fafc',
                  border: 'None',
                  fontSize: 17,
                  marginBottom: 16,
                  boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  height: '48px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.border = 'none'}
                onBlur={e => e.target.style.border = 'none'}
                required
              />
              {/* Date of Birth */}
              <input
                name="dob"
                type="date"
                placeholder="Date of Birth"
                value={formData.dob}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  background: '#23272f',
                  color: '#f8fafc',
                  border: 'None',
                  fontSize: 17,
                  marginBottom: 16,
                  boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  height: '48px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.border = '2px solid #2196f3'}
                onBlur={e => e.target.style.border = '2px solid #00bcd4'}
              />
              {/* Gender Dropdown */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    background: '#23272f',
                    color: '#f8fafc',
                    border: 'None',
                    fontSize: 17,
                    marginBottom: 0,
                    boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                    transition: 'border 0.2s, box-shadow 0.2s',
                    appearance: 'none',
                    height: '48px',
                    padding: '12px',
                    paddingRight: '40px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.border = '2px solid #2196f3'}
                  onBlur={e => e.target.style.border = '2px solid #00bcd4'}
                  required
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <span style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#00bcd4',
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              {/* Check In Button */}
              <button
                type="submit"
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(90deg, #00bcd4 0%, #2196f3 100%)',
                  fontSize: 18,
                  marginTop: 18,
                  marginBottom: 12,
                  boxShadow: '0 4px 16px 0 rgba(33,150,243,0.18)',
                  letterSpacing: 0.5,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={e => e.target.style.background = 'linear-gradient(90deg, #2196f3 0%, #00bcd4 100%)'}
                onMouseOut={e => e.target.style.background = 'linear-gradient(90deg, #00bcd4 0%, #2196f3 100%)'}
                disabled={loading}
              >
                {loading ? 'Checking In...' : 'Check In'}
              </button>
              {/* Scan ID with Camera Button */}
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)',
                  color: '#23272f',
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 10,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: 16,
                  boxShadow: '0 2px 8px 0 rgba(255,204,51,0.10)',
                  letterSpacing: 0.2,
                  transition: 'background 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onClick={handleOpenCamera}
                disabled={ocrLoading || showCamera}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ffb347" style={{ marginRight: 4 }}>
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="#fffde7" />
                  <path stroke="#ffb347" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                  <circle cx="12" cy="12" r="3" fill="#ffb347" />
                </svg>
                Scan ID with Camera
              </button>
              {/* Camera Modal/Preview */}
              {showCamera && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.7)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 320, height: 240 }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: 320, height: 240, borderRadius: 8, background: '#23272f', objectFit: 'cover' }} />
                      <div
                        style={{
                          position: 'absolute',
                          left: (320 - ID_BOX_WIDTH) / 2,
                          top: (240 - ID_BOX_HEIGHT) / 2,
                          width: ID_BOX_WIDTH,
                          height: ID_BOX_HEIGHT,
                          border: `3px solid ${mainIdBoxAligned ? '#43e97b' : '#00bcd4'}`,
                          borderRadius: 12,
                          boxSizing: 'border-box',
                          pointerEvents: 'none',
                          transition: 'border 0.2s',
                          zIndex: 2,
                          background: 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            color: mainIdBoxAligned ? '#43e97b' : '#00bcd4',
                            fontWeight: 600,
                            fontSize: 15,
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            position: 'absolute',
                            top: -28,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 3,
                            letterSpacing: 0.2,
                          }}
                        >
                          {mainIdBoxAligned
                            ? 'Hold steady! Capturing in 3s...'
                            : 'Align your ID card here'}
                        </span>
                      </div>
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <button
                      type="button"
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                        color: '#23272f',
                        fontWeight: 700,
                        marginTop: 18,
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: 16,
                        boxShadow: '0 2px 8px 0 rgba(67,233,123,0.10)',
                      }}
                      onClick={handleCapture}
                      disabled={ocrLoading}
                    >
                      {ocrLoading ? 'Scanning...' : 'Capture'}
                    </button>
                    <button
                      type="button"
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(90deg, #e57373 0%, #ff8a65 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        marginTop: 10,
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: 15,
                      }}
                      onClick={() => {
                        setShowCamera(false);
                        if (videoStream) {
                          videoStream.getTracks().forEach(track => track.stop());
                          setVideoStream(null);
                        }
                      }}
                      disabled={ocrLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* Camera Overlay Component */}
              {showCameraOverlay && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.7)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 24,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'relative', width: 340, height: 260 }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: 340,
                          height: 260,
                          borderRadius: 8,
                          background: '#23272f',
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: (340 - ID_BOX_WIDTH) / 2,
                          top: (260 - ID_BOX_HEIGHT) / 2,
                          width: ID_BOX_WIDTH,
                          height: ID_BOX_HEIGHT,
                          border: `3px solid ${idBoxAligned ? '#43e97b' : '#00bcd4'}`,
                          borderRadius: 12,
                          boxSizing: 'border-box',
                          pointerEvents: 'none',
                          transition: 'border 0.2s',
                          zIndex: 2,
                          background: 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            color: idBoxAligned ? '#43e97b' : '#00bcd4',
                            fontWeight: 600,
                            fontSize: 15,
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            position: 'absolute',
                            top: -28,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 3,
                            letterSpacing: 0.2,
                          }}
                        >
                          {idBoxAligned
                            ? 'Hold steady! Capturing in 3s...'
                            : 'Align your ID card here'}
                        </span>
                      </div>
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <button
                      type="button"
                      style={{
                        marginTop: 18,
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: 16,
                      }}
                      onClick={() => {
                        setShowCameraOverlay(false);
                        if (videoStream) {
                          videoStream.getTracks().forEach((track) => track.stop());
                          setVideoStream(null);
                        }
                        setIdBoxAligned(false);
                        if (holdTimer) clearTimeout(holdTimer);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
              {/* Feedback Message */}
              {message && (
                <div style={{
                  ...messageStyle(success),
                  fontSize: 16,
                  marginTop: 20,
                  border: success ? '1.5px solid #b2dfdb' : '1.5px solid #ffcdd2',
                  background: success ? '#e0f7fa' : '#ffebee',
                  color: success ? '#00796b' : '#c62828',
                }}>{message}</div>
              )}
            </form>
          )}
        </div>
      )}
      {/* Spinner keyframes for Scan ID */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default VisitorForm;