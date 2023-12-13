// AuthContext.js
import { createContext, useContext, useReducer } from 'react';

const AuthContext = createContext();

const initialState = {
  userLoggedIn: false,
  userRegistered: false,
  guest: false,
  username: '', 
  email: '',
  userId: '',
  role: 'user',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        userLoggedIn: true,
        userRegistered: true,
        guest: false,
        username: action.payload.username,
        email: action.payload.email,
        userId: action.payload.userId,
        role: action.payload.role,
      };
    case 'LOGOUT':
      return initialState; // Reset the state to its initial values
    // Add other cases as needed
    default:
      return state;
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
