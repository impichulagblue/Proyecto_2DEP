import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css';

// Importaciones con rutas correctas
const LoginPage = lazy(() => import('./components/LoginPage/LoginPage'));
const HomePage = lazy(() => import('./components/HomePage/HomePage'));
const MainLayout = lazy(() => import('./components/MainLayout/MainLayout'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="loading">Cargando aplicación...</div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;