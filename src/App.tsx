import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home/Home';
import Catalogo from './pages/Catalogo/Catalogo';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Contacto from './pages/Contacto/Contacto';
import Perfil from './pages/Perfil/Perfil';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Ruta original (mantener para compatibilidad) */}
        <Route path="/catalogo" element={<Catalogo />} />
        
        {/* NUEVAS RUTAS con slugs */}
        <Route path="/catalogo/:categoriaSlug" element={<Catalogo />} />
        <Route path="/catalogo/:categoriaSlug/:subcategoriaSlug" element={<Catalogo />} />
        
        {/* NUEVA RUTA: Vista de producto individual */}
        <Route path="/producto/:id" element={<ProductDetail />} />
        
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Router>
  );
}

export default App;