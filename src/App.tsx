import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home/Home';
import Catalogo from './pages/Catalogo/Catalogo';
import Contacto from './pages/Contacto/Contacto';
import Perfil from './pages/Perfil/Perfil';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Router>
  );
}

export default App;