import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../firebase/firebaseConfig';
import { ref, set, remove, onValue, off } from 'firebase/database';
import { FaHeart, FaRegHeart, FaStar, FaTimes, FaAngleUp, FaAngleDown } from 'react-icons/fa';
import './PokemonViewer.css';

const PokemonViewer = () => {
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [evolutions, setEvolutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const navigate = useNavigate();

  // Manejo de autenticación
  useEffect(() => {
    const authUnsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    });

    return () => authUnsubscribe();
  }, [navigate]);

  // Cargar favoritos
  useEffect(() => {
    if (!user) return;

    const favoritesRef = ref(database, `users/${user.uid}/favorites`);
    const favoritesUnsubscribe = onValue(favoritesRef, (snapshot) => {
      const favs = [];
      snapshot.forEach(child => {
        favs.push({
          id: child.key,
          ...child.val()
        });
      });
      setFavorites(favs);
    }, (error) => {
      console.error("Error al cargar favoritos:", error);
      setError("Error al cargar favoritos");
    });

    return () => off(favoritesRef, 'value', favoritesUnsubscribe);
  }, [user]);

  // Cargar Pokémon aleatorio al inicio
  useEffect(() => {
    fetchRandomPokemon();
  }, []);

  const fetchRandomPokemon = async () => {
    setLoading(true);
    setError(null);
    try {
      const randomId = Math.floor(Math.random() * 898) + 1;
      await loadPokemonById(randomId);
    } catch (err) {
      console.error("Error al cargar Pokémon:", err);
      setError("No se pudo cargar el Pokémon. Intenta de nuevo.");
      setCurrentPokemon(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPokemonById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const [pokemonResponse, speciesResponse] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`)
      ]);

      if (!pokemonResponse.ok || !speciesResponse.ok) {
        throw new Error('No se pudo cargar el Pokémon');
      }

      const [pokemonData, speciesData] = await Promise.all([
        pokemonResponse.json(),
        speciesResponse.json()
      ]);

      if (speciesData.evolution_chain?.url) {
        await fetchEvolutionChain(speciesData.evolution_chain.url, pokemonData.name);
      } else {
        setEvolutions([]);
      }

      const formattedPokemon = {
        id: pokemonData.id,
        name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
        types: pokemonData.types.map(t => t.type.name),
        height: pokemonData.height / 10,
        weight: pokemonData.weight / 10,
        stats: {
          HP: pokemonData.stats.find(s => s.stat.name === "hp").base_stat,
          Ataque: pokemonData.stats.find(s => s.stat.name === "attack").base_stat,
          Defensa: pokemonData.stats.find(s => s.stat.name === "defense").base_stat,
          "Atq. Esp.": pokemonData.stats.find(s => s.stat.name === "special-attack").base_stat,
          "Def. Esp.": pokemonData.stats.find(s => s.stat.name === "special-defense").base_stat,
          Velocidad: pokemonData.stats.find(s => s.stat.name === "speed").base_stat
        },
        image: pokemonData.sprites.other["official-artwork"].front_default || 
               pokemonData.sprites.front_default
      };

      setCurrentPokemon(formattedPokemon);
    } catch (err) {
      console.error("Error al cargar Pokémon:", err);
      setError(`Error al cargar Pokémon: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvolutionChain = async (url, currentPokemonName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo cargar la cadena de evolución');
      const data = await response.json();
      
      const evolutionArray = [];
      
      const processEvolution = async (chain, stage = 1) => {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${chain.species.name}`);
        if (pokemonResponse.ok) {
          const pokemonData = await pokemonResponse.json();
          
          evolutionArray.push({
            name: chain.species.name.charAt(0).toUpperCase() + chain.species.name.slice(1),
            id: pokemonData.id,
            image: pokemonData.sprites.other["official-artwork"].front_default || 
                  pokemonData.sprites.front_default,
            stage,
            current: chain.species.name === currentPokemonName.toLowerCase()
          });
        }
        
        if (chain.evolves_to?.length > 0) {
          for (const evolution of chain.evolves_to) {
            await processEvolution(evolution, stage + 1);
          }
        }
      };
      
      await processEvolution(data.chain);
      
      evolutionArray.sort((a, b) => a.stage - b.stage || a.id - b.id);
      setEvolutions(evolutionArray);
    } catch (err) {
      console.error("Error al cargar evoluciones:", err);
      setEvolutions([]);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !currentPokemon) return;
    
    const favRef = ref(database, `users/${user.uid}/favorites/${currentPokemon.id}`);
    
    try {
      if (isFavorite(currentPokemon.id)) {
        await remove(favRef);
      } else {
        await set(favRef, {
          name: currentPokemon.name,
          image: currentPokemon.image,
          types: currentPokemon.types,
          date: Date.now()
        });
      }
    } catch (error) {
      console.error("Error al guardar favorito:", error);
      setError("Error al guardar favorito");
    }
  };

  const isFavorite = (pokemonId) => {
    return favorites.some(fav => fav.id === pokemonId.toString());
  };

  const loadPokemonByName = async (name) => {
    if (!name.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await loadPokemonById(name.toLowerCase());
      setShowFavorites(false);
    } catch (err) {
      console.error(`Error al cargar ${name}:`, err);
      setError(`No se pudo cargar ${name}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  const playPokemonCry = () => {
    if (!currentPokemon) return;
    const cryUrl = `https://play.pokemonshowdown.com/audio/cries/${currentPokemon.name.toLowerCase()}.mp3`;
    const audio = new Audio(cryUrl);
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Error al reproducir el grito:", e));
  };

  const toggleFavoritesView = () => {
    setShowFavorites(!showFavorites);
  };

  const toggleContentVisibility = () => {
    setContentVisible(!contentVisible);
  };

  if (!user) {
    return <div className="loading">Cargando usuario...</div>;
  }

  return (
    <div className="pokemon-viewer">
      <div className="pokemon-control-bar">
        <h1>POKÉMON ALEATORIO</h1>
        <button 
          onClick={toggleContentVisibility}
          className="toggle-visibility-btn"
        >
          {contentVisible ? (
            <>
              <FaAngleUp /> OCULTAR
            </>
          ) : (
            <>
              <FaAngleDown /> MOSTRAR
            </>
          )}
        </button>
      </div>

      {contentVisible && (
        <div className="pokemon-content">
          <button 
            className={`toggle-favorites-btn ${showFavorites ? 'active' : ''}`}
            onClick={toggleFavoritesView}
          >
            {showFavorites ? (
              <>
                <FaTimes /> Ocultar Favoritos
              </>
            ) : (
              <>
                <FaStar /> Mostrar Favoritos ({favorites.length})
              </>
            )}
          </button>
          
          {loading && <div className="loading">Cargando Pokémon...</div>}
          {error && <div className="error-message">{error}</div>}
          
          {showFavorites ? (
            <div className="favorites-section">
              <h2>Mis Pokémon Favoritos</h2>
              {favorites.length === 0 ? (
                <p className="no-favorites">No tienes Pokémon favoritos aún</p>
              ) : (
                <div className="favorites-grid">
                  {favorites.map(fav => (
                    <div 
                      key={`fav-${fav.id}`} 
                      className="favorite-item"
                      onClick={() => loadPokemonByName(fav.name)}
                    >
                      <img src={fav.image} alt={fav.name} className="favorite-image" />
                      <span className="favorite-name">{fav.name}</span>
                      <button 
                        className="remove-favorite-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(ref(database, `users/${user.uid}/favorites/${fav.id}`));
                        }}
                        title="Eliminar de favoritos"
                      >
                        <FaTimes />
                      </button>
                      <div className="favorite-types">
                        {fav.types.map((type, index) => (
                          <span key={index} className={`type-badge ${type.toLowerCase()}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentPokemon && !loading && !error && (
            <div className="pokemon-card">
              <div className="pokemon-header">
                <h2>{currentPokemon.name}</h2>
                <p className="pokemon-number">#{currentPokemon.id}</p>
                <button 
                  onClick={toggleFavorite}
                  className="favorite-btn"
                  title={isFavorite(currentPokemon.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(currentPokemon.id) ? (
                    <FaHeart className="favorite-icon filled" />
                  ) : (
                    <FaRegHeart className="favorite-icon" />
                  )}
                </button>
              </div>
              
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Buscar Pokémon por nombre o ID"
                  className="pokemon-search"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadPokemonByName(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              
              <div className="pokemon-image-container" onClick={playPokemonCry}>
                <img 
                  src={currentPokemon.image} 
                  alt={currentPokemon.name} 
                  className="pokemon-image"
                />
                <div className="sound-hint">🔊 Click para escuchar</div>
              </div>
              
              <div className="pokemon-types">
                {currentPokemon.types.map((type, index) => (
                  <span key={`type-${index}`} className={`type-badge ${type.toLowerCase()}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                ))}
              </div>
              
              <div className="pokemon-info">
                <div className="info-item">
                  <span className="info-label">Altura</span>
                  <span>{currentPokemon.height} m</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Peso</span>
                  <span>{currentPokemon.weight} kg</span>
                </div>
              </div>
              
              {evolutions.length > 0 && (
                <div className="evolution-chain">
                  <h3>Evoluciones</h3>
                  <div className="evolution-container">
                    {evolutions.map((evolution, index) => (
                      <React.Fragment key={`evo-${index}`}>
                        <div 
                          className={`evolution-item ${evolution.current ? 'current-evolution' : ''}`}
                          onClick={() => loadPokemonByName(evolution.name)}
                        >
                          <img 
                            src={evolution.image} 
                            alt={evolution.name}
                            className="evolution-image"
                          />
                          <span className="evolution-name">{evolution.name}</span>
                        </div>
                        {index < evolutions.length - 1 && evolution.stage < evolutions[index + 1].stage && (
                          <div className="evolution-arrow">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pokemon-stats">
                <h3>Estadísticas</h3>
                <div className="stats-grid">
                  {Object.entries(currentPokemon.stats).map(([statName, value]) => (
                    <div key={`stat-${statName}`} className="stat-item">
                      <span className="stat-name">{statName}:</span>
                      <div className="stat-bar-container">
                        <div 
                          className="stat-bar" 
                          style={{width: `${(value / 255) * 100}%`}}
                        ></div>
                        <span className="stat-value">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                className="random-button" 
                onClick={fetchRandomPokemon}
                disabled={loading}
              >
                {loading ? "Cargando..." : "Mostrar otro Pokémon"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PokemonViewer;