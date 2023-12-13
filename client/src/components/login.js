import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';


export default function LoginPage({ onLogin }) {
  const { dispatch } = useAuth();
  // const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  // const [userId, setUserId] = useState('');
  const [pw, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      if (!email || !pw) {
        setErrorMessage('Both email and password are required.');
        return;
      }
  
      const response = await axios.post('http://localhost:8000/login', {
        email: email,
        pw: pw,
      });
  
      console.log('login response:', response);
  
      if (response && response.data) {
        console.log(response.data.message);
        const token = response.data.token; // Adjust this based on your server response
        // console.log(token);
        const username = response.data.username;
        const email = response.data.email;
        const userId = response.data.userId;
        const role = response.data.role;
        // setUsername(username);
        document.cookie = `authToken=${token}; path=/;`;
        dispatch({ type: 'LOGIN', payload: { username, email, userId ,role } });
        onLogin();
      } else {
        console.error('response does not contain expected data:', response);
        setErrorMessage('bad response from server');
      }
  
    } catch (error) {
      console.error('Error during login:', error.response?.data?.errorMessage || error.message);
      setErrorMessage(error.response?.data?.errorMessage || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Login to Fake Stack Overflow</h2>
      <p>Already have an account? Log in below.</p>
        <form>
          <div>
            <label>Email:</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" value={pw} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
          <button onClick={handleLogin}>Login</button>
        </form>
      </div>
  );
}