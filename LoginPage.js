import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  auth, 
  googleProvider, 
  twitterProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from '../../firebase/firebaseConfig';
import './LoginPage.css';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Error en login:", err);
      setError(`Error al iniciar sesión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Error en login:", err);
      setError(`Error al iniciar sesión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
      setShowRegister(false);
    } catch (err) {
      console.error("Error en registro:", err);
      setError(`Error al registrarse: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyberpunk-container">
      <div className="cyberpunk-login-box">
        <div className="cyberpunk-header">
          <h1 className="neon-text">Pokémon Click Game</h1>
          <p className="cyberpunk-subtitle neon-text">Inicia sesión para jugar y explorar Pokémon</p>
        </div>
        
        {showRegister ? (
          <form onSubmit={handleRegister} className="cyberpunk-form">
            <div className="form-group">
              <label className="neon-text">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo"
                className="cyberpunk-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="neon-text">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="cyberpunk-input"
                required
                minLength="6"
              />
            </div>
            <div className="form-group">
              <label className="neon-text">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="cyberpunk-input"
                required
                minLength="6"
              />
            </div>
            <button 
              type="submit"
              className="cyberpunk-button primary"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
            <button 
              type="button"
              className="cyberpunk-button secondary"
              onClick={() => setShowRegister(false)}
            >
              Volver a inicio de sesión
            </button>
          </form>
        ) : (
          <>
            <div className="login-buttons">
              <button 
                className="cyberpunk-button google" 
                onClick={() => handleSocialLogin(googleProvider)}
                disabled={loading}
              >
                <span className="button-icon">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" 
                    alt="Google"  
                    width="20"
                  />
                </span>
                Continuar con Google
              </button>
              
              <button 
                className="cyberpunk-button twitter" 
                onClick={() => handleSocialLogin(twitterProvider)}
                disabled={loading}
              >
                <span className="button-icon">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" 
                    alt="Twitter" 
                    width="20"
                  />
                </span>
                Continuar con Twitter
              </button>
              
              <div className="separator">
                <span className="neon-text">o</span>
              </div>
              
              <form onSubmit={handleEmailLogin} className="email-form">
                <div className="form-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    className="cyberpunk-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="cyberpunk-input"
                    required
                    minLength="6"
                  />
                </div>
                <button 
                  type="submit"
                  className="cyberpunk-button primary"
                  disabled={loading}
                >
                  {loading ? 'Iniciando...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>
            
            <div className="register-prompt">
              <p className="neon-text">¿No tienes una cuenta?</p>
              <button 
                className="cyberpunk-button text-button"
                onClick={() => setShowRegister(true)}
              >
                Regístrate aquí
              </button>
            </div>
          </>
        )}
        
        {error && <div className="cyberpunk-error">{error}</div>}
        
        <div className="cyberpunk-footer neon-text">
          Al iniciar sesión aceptas nuestros términos y condiciones
        </div>
      </div>
    </div>
  );
};

export default LoginPage;