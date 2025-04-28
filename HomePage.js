import React, { Suspense } from 'react';
import './HomePage.css';

// Importación diferida con rutas corregidas
const ClickGame = React.lazy(() => import('../ClickGame/ClickGame')); // Cambiado de './ClickGame/ClickGame' a '../ClickGame/ClickGame'
const PokemonViewer = React.lazy(() => import('../PokemonViewer/PokemonViewer')); // Asegúrate que esta ruta también sea correcta

const HomePage = () => {
  return (
    <div className="home-container">
      <Suspense fallback={<div>Cargando juegos...</div>}>
        <ClickGame />
        <PokemonViewer />
      </Suspense>
    </div>
  );
};

export default HomePage;