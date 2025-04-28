import React, { useState, useEffect, useRef } from 'react';
import { auth, database } from '../../firebase/firebaseConfig';
import { ref, push, set, onValue, off, orderByChild, limitToLast, query } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './ClickGame.css';

const ClickGame = () => {
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isActive, setIsActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [gameVisible, setGameVisible] = useState(true);
  const timerRef = useRef(null);
  const clicksRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) navigate('/login');
      else {
        setUser(user);
        loadHighScore(user.uid);
        loadHistory(user.uid);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadHighScore = (userId) => {
    try {
      const highScoreRef = ref(database, `users/${userId}/highScore`);
      onValue(highScoreRef, (snapshot) => {
        const score = snapshot.val() || 0;
        setHighScore(Math.round(score));
      });
    } catch (error) {
      console.error("Error cargando puntuación máxima:", error);
      setError("Error al cargar récord");
    }
  };

  const loadHistory = (userId) => {
    try {
      const scoresRef = ref(database, `users/${userId}/scores`);
      const scoresQuery = query(scoresRef, orderByChild('date'), limitToLast(5));
      
      onValue(scoresQuery, (snapshot) => {
        const scores = [];
        snapshot.forEach(child => {
          scores.push({
            id: child.key,
            score: Math.round(child.val().score),
            date: child.val().date
          });
        });
        setHistory(scores.reverse());
      });
    } catch (error) {
      console.error("Error cargando historial:", error);
      setError("Error al cargar historial");
    }
  };

  const saveScore = async () => {
    if (!user) return;
    const currentClicks = Math.round(clicksRef.current);
    
    try {
      const newScoreRef = push(ref(database, `users/${user.uid}/scores`));
      await set(newScoreRef, {
        score: currentClicks,
        date: Date.now()
      });

      if (currentClicks > highScore) {
        await set(ref(database, `users/${user.uid}/highScore`), currentClicks);
        setHighScore(currentClicks);
      }
    } catch (error) {
      console.error("Error guardando puntuación:", error);
      setError("Error al guardar puntuación");
    }
  };

  const startGame = () => {
    setClicks(0);
    clicksRef.current = 0;
    setTimeLeft(15);
    setGameOver(false);
    setIsActive(true);
    setError(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          setIsActive(false);
          setGameOver(true);
          if (user) saveScore();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const handleClick = () => {
    if (isActive) {
      setClicks(prev => {
        const newClicks = prev + 1;
        clicksRef.current = newClicks;
        return newClicks;
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (user) {
        off(ref(database, `users/${user.uid}/highScore`));
        off(ref(database, `users/${user.uid}/scores`));
      }
    };
  }, [user]);

  return (
    <div className="click-game-wrapper">
      <div className="game-control-bar">
        <h2>JUEGO DE CLICS</h2>
        <button 
          onClick={() => setGameVisible(!gameVisible)}
          className="toggle-visibility-btn"
        >
          {gameVisible ? '▲ OCULTAR ▲' : '▼ MOSTRAR ▼'}
        </button>
      </div>

      {gameVisible && (
        <div className="click-game-content">
          <div className="stats-bar">
            <div className="stat-box">
              <span>Tiempo:</span>
              <span className="stat-value">{timeLeft}s</span>
            </div>
            <div className="stat-box">
              <span>Clics:</span>
              <span className="stat-value">{clicks}</span>
            </div>
            <div className="stat-box">
              <span>Récord:</span>
              <span className="stat-value">{highScore}</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="game-area">
            {!isActive && !gameOver && (
              <div className="game-start-screen">
                <h3>¡Haz clic lo más rápido posible!</h3>
                <p>Tienes 15 segundos</p>
                <button onClick={startGame} className="start-button">
                  ¡EMPEZAR!
                </button>
              </div>
            )}

            {isActive && (
              <button className="click-target" onClick={handleClick}>
                <span>¡CLIC AQUÍ!</span>
                <div className="click-counter">{clicks}</div>
              </button>
            )}

            {gameOver && (
              <div className="game-end-screen">
                <h3>¡TIEMPO TERMINADO!</h3>
                <div className="results">
                  <p>Total: <strong>{clicks}</strong> clics</p>
                  <p>Velocidad: <strong>{(clicks/15).toFixed(2)}</strong> clics/s</p>
                  {clicks > highScore && <p className="new-record">¡NUEVO RÉCORD!</p>}
                </div>
                <button onClick={startGame} className="play-again-button">
                  JUGAR DE NUEVO
                </button>
              </div>
            )}
          </div>

          {user && history.length > 0 && (
            <div className="history-panel">
              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="history-toggle-btn"
              >
                {showHistory ? 'OCULTAR HISTORIAL' : 'MOSTRAR HISTORIAL'}
              </button>
              
              {showHistory && (
                <div className="scores-history">
                  <h4>Tus últimos 5 intentos:</h4>
                  <ul>
                    {history.map((item, index) => (
                      <li key={index}>
                        <span className="history-date">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <span className="history-score">
                          {item.score} clics {item.score === highScore && '🏆'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClickGame;