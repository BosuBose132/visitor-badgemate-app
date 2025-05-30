// React form with fields: name, company, email, purpose
// On submit, call Meteor method 'visitors.checkIn'
// Show success or duplicate message

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    Meteor.call('visitors.checkIn', formData, (error, result) => {
      setLoading(false);
      if (error) {
        setMessage('Check-in failed or duplicate entry.');
        setSuccess(false);
      } else {
        setMessage('Visitor successfully checked in!');
        setSuccess(true);
        setFormData({ name: '', company: '', email: '', purpose: '' });
      }
    });
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
    </div>
  );
};

export default VisitorForm;


