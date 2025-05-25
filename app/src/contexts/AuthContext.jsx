import React, { createContext, useState, useContext, useEffect } from 'react';
import userAvatarPlaceholder from '../assets/images/user-avatar.png'; // Ensure this path is correct

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('demoUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });  
  
  const [isGapiLoaded, setIsGapiLoaded] = useState(true);   
  const [gapiInstance, setGapiInstance] = useState({ client: { sheets: {} } }); 

  useEffect(() => {    
    if (user) {
      localStorage.setItem('demoUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('demoUser');
    }
  }, [user]);

  const signIn = () => {    
    const demoUser = {
      name: 'Demo User',
      email: 'demo@example.com',
      imageUrl: userAvatarPlaceholder,
    };
    setUser(demoUser);
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isGapiLoaded, gapiInstance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);