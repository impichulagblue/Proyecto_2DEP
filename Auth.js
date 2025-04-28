import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { auth, signOut } from '../../firebase/firebaseConfig';
import './Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useContext(AuthContext);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="auth-container">
      <div className="auth-user">
        <img 
          src={currentUser.photoURL || 'https://via.placeholder.com/30'} 
          alt="User" 
          className="auth-user-photo"
        />
        <div className="auth-user-info">
          <span className="auth-user-name">
            {currentUser.displayName || 'Usuario'}
          </span>
          <button 
            onClick={handleSignOut} 
            className="auth-button sign-out"
            disabled={loading}
          >
            {loading ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
};

export default Auth;