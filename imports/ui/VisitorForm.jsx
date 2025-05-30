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
    <div style={cardStyle}>
      <h2 style={{marginBottom: '18px', color: '#007cf0'}}>Visitor Check-In</h2>
      <form onSubmit={handleSubmit} style={{width: '100%'}} autoComplete="off">
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        <input
          name="company"
          placeholder="Company / Organization"
          value={formData.company}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        <input
          name="purpose"
          placeholder="Purpose of Visit"
          value={formData.purpose}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Checking In...' : 'Check In'}
        </button>
        {message && (
          <div style={messageStyle(success)}>{message}</div>
        )}
      </form>
    </div>
  );
};

export default VisitorForm;


