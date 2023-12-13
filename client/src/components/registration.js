import React, { useState } from 'react';
import axios from 'axios';

const RegistrationForm = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPassword] = useState('');
  const [passwordVerification, setPasswordVerification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    try {
      if (!username || !email || !pw || !passwordVerification) {
        setErrorMessage('All fields are required.');
        return;
      }

      if (pw !== passwordVerification) {
        setErrorMessage('Passwords do not match');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMessage('Invalid email address');
        return;
      }

      const emailId = email.split('@')[0];
      if (pw.includes(username) || pw.includes(emailId)) {
        setErrorMessage('Password should not contain the username or email id.');
        return;
      }

      const response = await axios.post('http://localhost:8000/register', {
        username,
        email,
        pw,
      });

      // successful registration
      console.log(response.data.message);
      onRegister();

    } catch (error) {
      console.error('Error registering user', error.response.data.error);
      setErrorMessage(error.response.data.error || 'Registration failed');
    }
  };

  return (
    <div>
      <h2>Welcome to Fake Stack Overflow!</h2>
      <p>Create an account to get started.</p>
      <div>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" value={pw} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label>Password Verification:</label>
        <input type="password" value={passwordVerification} onChange={(e) => setPasswordVerification(e.target.value)} />
      </div>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button onClick={handleRegister}>Sign Up</button>
    </div>
  );
};

export default RegistrationForm;
