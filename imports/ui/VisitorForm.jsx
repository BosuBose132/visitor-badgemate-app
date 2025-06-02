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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#23272f',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Hospital doodle SVG background */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 0.13,
          pointerEvents: 'none',
        }}
      >
        <g>
          <rect x="100" y="600" width="180" height="120" rx="16" fill="#00bcd4"/>
          <rect x="320" y="650" width="120" height="70" rx="12" fill="#2196f3"/>
          <rect x="500" y="620" width="160" height="100" rx="14" fill="#b2ebf2"/>
          <rect x="700" y="670" width="110" height="50" rx="10" fill="#00bcd4"/>
          <rect x="850" y="600" width="200" height="120" rx="16" fill="#2196f3"/>
          <rect x="1100" y="650" width="120" height="70" rx="12" fill="#b2ebf2"/>
          {/* Cross symbol on hospital */}
          <rect x="170" y="640" width="40" height="10" rx="5" fill="#fff"/>
          <rect x="185" y="625" width="10" height="40" rx="5" fill="#fff"/>
          <rect x="900" y="640" width="40" height="10" rx="5" fill="#fff"/>
          <rect x="915" y="625" width="10" height="40" rx="5" fill="#fff"/>
          {/* Trees doodle */}
          <ellipse cx="250" cy="720" rx="18" ry="32" fill="#388e3c"/>
          <ellipse cx="600" cy="710" rx="14" ry="26" fill="#388e3c"/>
          <ellipse cx="1200" cy="720" rx="18" ry="32" fill="#388e3c"/>
        </g>
      </svg>
      <div style={{
        ...cardStyle,
        zIndex: 2,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #e3eafc',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#00bcd4" style={{marginBottom: 8}}>
            <rect x="3" y="3" width="18" height="18" rx="5" fill="#e0f7fa"/>
            <path stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
          </svg>
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
            }}
            onFocus={e => e.target.style.border = '2px solid #2196f3'}
            onBlur={e => e.target.style.border = '2px solid #00bcd4'}
            required
          />
          {/* Purpose of Visit */}
          <input
            name="purpose"
            placeholder="Purpose of Visit"
            value={formData.purpose}
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
            }}
            onFocus={e => e.target.style.border = '2px solid #2196f3'}
            onBlur={e => e.target.style.border = '2px solid #00bcd4'}
            required
          />
          {/* ID Scan Image Upload */}
          <label style={{
            display: 'block',
            margin: '10px 0 8px 0',
            color: '#007cf0',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 0.1,
          }}>
            Scan ID (auto-fill Name & Company):
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{
                display: 'block',
                marginTop: 6,
                marginBottom: 10,
                fontSize: 15,
                border: 'none',
                background: 'none',
                color: '#23272f',
              }}
              disabled={ocrLoading}
            />
          </label>
          {ocrLoading && (
            <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
              <span style={{width: 18, height: 18, border: '2.5px solid #43e97b', borderTop: '2.5px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 8}}></span>
              Scanning ID...
            </div>
          )}
          {/* Check In Button (replaces Scan ID button) */}
          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: 'linear-gradient(90deg, #00bcd4 0%, #2196f3 100%)',
              fontSize: 18,
              marginTop: 18,
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
        {/* Spinner keyframes for Scan ID */}
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default VisitorForm;


