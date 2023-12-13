import React, { useState } from 'react';
import axios from 'axios';
import RegistrationForm from './registration';
import LoginForm from './login';

export default function WelcomePage({ onRegister, onLogin, onGuest }) {
  const [selectedOption, setSelectedOption] = useState('register');

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const renderSelectedOption = () => {
    if (selectedOption === 'register') {
      return <RegistrationForm onRegister={onRegister} />;
    } else if (selectedOption === 'login') {
      return <LoginForm onLogin={onLogin} />;
    }
  };

  return (
    <div>
      <h2>Welcome to Fake Stack Overflow!</h2>
      <p>Choose an option to get started:</p>
      <div>
        <button onClick={() => handleOptionChange('register')}>Register</button>
        <button onClick={() => handleOptionChange('login')}>Login</button>
        <button onClick={onGuest}>Continue as Guest</button>
      </div>
      {renderSelectedOption()}
    </div>
  );
}