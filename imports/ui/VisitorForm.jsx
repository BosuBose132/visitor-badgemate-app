// React form with fields: name, company, email, purpose
// On submit, call Meteor method 'visitors.checkIn'
// Show success or duplicate message

import React, { useState, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import Tesseract from 'tesseract.js';

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
  transition: 'background 0.2s',
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

const VisitorForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    purpose: ''
  });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
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
    if (!formData.name || !formData.company || !formData.email || !formData.purpose) {
      setMessage('All fields are required.');
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
          setFormData({ name: '', company: '', email: '', purpose: '' });
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
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => {/* Optionally log progress */}
      });
      // Simple parsing: try to extract name, email, company from OCR text
      let name = '', email = '', company = '', purpose = formData.purpose;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (let line of lines) {
        if (!email && emailRegex.test(line)) email = line;
        else if (!name && /[A-Za-z]+ [A-Za-z]+/.test(line) && line.length < 40) name = line;
        else if (!company && line.length > 2 && line.length < 40 && !line.includes('@')) company = line;
      }
      setFormData({
        name: name || formData.name,
        company: company || formData.company,
        email: email || formData.email,
        purpose
      });
      setMessage('ID scanned! Please verify and complete the form.');
      setSuccess(true);
    } catch (err) {
      setMessage('Failed to scan ID. Please try again.');
      setSuccess(false);
    }
    setOcrLoading(false);
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

  // Capture frame from video and run OCR
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
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng', {
        logger: m => {/* Optionally log progress */}
      });
      // Extract name and company from OCR text
      let name = '', company = '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        if (!name && /[A-Za-z]+ [A-Za-z]+/.test(lines[i]) && lines[i].length < 40) {
          name = lines[i];
          if (lines[i+1] && lines[i+1].length > 2 && lines[i+1].length < 40 && !lines[i+1].includes('@')) {
            company = lines[i+1];
          }
          break;
        }
      }
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        company: company || prev.company
      }));
      setMessage('ID scanned from camera! Please verify and complete the form.');
      setSuccess(true);
    } catch (err) {
      setMessage('Failed to scan ID from camera. Please try again.');
      setSuccess(false);
    }
    setOcrLoading(false);
  };

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
      {/* No background SVGs or doodles. Professional, clean gradient only. */}
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
          <span style={{fontSize: 72, marginBottom: 24}} role="img" aria-label="hospital">🏥</span>
          <h1 style={{color: '#007cf0', fontWeight: 800, fontSize: 36, margin: 0, textAlign: 'center', letterSpacing: 1}}>Check-In Successful!</h1>
          <p style={{color: '#00838f', fontSize: 20, margin: '24px 0 0 0', textAlign: 'center', fontWeight: 500, lineHeight: 1.5}}>
            Thank you for checking in.<br />
            Please wait to be called or assisted by our staff.<br />
            <span style={{fontSize: 28, display: 'block', marginTop: 16}}>Have a healthy day!</span>
          </p>
        </div>
      ) : (
        <div style={{
          ...cardStyle,
          zIndex: 2,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #e3eafc',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18}}>
            <span style={{fontSize: 48, marginBottom: 8}} role="img" aria-label="hospital">🏥</span>
            <h2 style={{margin: 0, color: '#007cf0', fontWeight: 700, fontSize: 26, letterSpacing: 0.5}}>Visitor Check-In</h2>
            <p style={{margin: '6px 0 0 0', color: '#6b7280', fontSize: 15, textAlign: 'center'}}>Welcome! Please fill out the form below to check in.</p>
          </div>
          <form onSubmit={handleSubmit} style={{width: '100%', marginTop: 8}} autoComplete="off">
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
                border: '2px solid #00bcd4',
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
                border: '2px solid #00bcd4',
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
                border: '2px solid #00bcd4',
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
            <div style={{position: 'relative', marginBottom: 16}}>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  background: '#23272f',
                  color: '#f8fafc',
                  border: '2px solid #00bcd4',
                  fontSize: 17,
                  marginBottom: 0,
                  boxShadow: '0 2px 8px 0 rgba(0,188,212,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  appearance: 'none',
                  height: '48px',
                  padding: '12px',
                  paddingRight: '40px', // space for icon
                  width: '100%', // Ensure full width like other inputs
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
              {/* Dropdown arrow icon */}
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
                  <path d="M6 8L10 12L14 8" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            {/* Check In Button (replaces Scan ID button) */}
            <button
              type="submit"
              style={{
                ...buttonStyle,
                background: 'linear-gradient(90deg, #00bcd4 0%, #2196f3 100%)',
                fontSize: 18,
                marginTop: 18,
                marginBottom: 12, // Add space below Check In button
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
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ffb347" style={{marginRight: 4}}>
                <rect x="3" y="3" width="18" height="18" rx="5" fill="#fffde7"/>
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
                <div style={{background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <video ref={videoRef} autoPlay playsInline style={{width: 320, height: 240, borderRadius: 8, background: '#23272f'}} />
                  <canvas ref={canvasRef} style={{display: 'none'}} />
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