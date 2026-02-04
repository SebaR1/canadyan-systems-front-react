import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home/Home';
import Catalogo from './pages/Catalogo/Catalogo';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Contacto from './pages/Contacto/Contacto';
import Perfil from './pages/Perfil/Perfil';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// Admin Pages
import VerUsuarios from './pages/Admin/VerUsuarios';
import VerProductos from './pages/Admin/VerProductos';
import CategoriasAtributos from './pages/Admin/CategoriasAtributos';

function App() {
  return (
    <Router basename="/canadian-sistemas">
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Ruta original (mantener para compatibilidad) */}
        <Route path="/catalogo" element={<Catalogo />} />

        {/* NUEVAS RUTAS con slugs - Soporta hasta 3 niveles */}
        <Route path="/catalogo/:categoriaSlug" element={<Catalogo />} />
        <Route path="/catalogo/:categoriaSlug/:subcategoriaSlug" element={<Catalogo />} />
        <Route path="/catalogo/:categoriaSlug/:subcategoriaSlug/:subsubcategoriaSlug" element={<Catalogo />} />
        
        {/* NUEVA RUTA: Vista de producto individual */}
        <Route path="/producto/:id" element={<ProductDetail />} />
        
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/perfil" element={<Perfil />} />

        {/* RUTAS DE ADMIN - Protegidas por validación del backend */}
        <Route path="/admin/usuarios" element={<VerUsuarios />} />
        <Route path="/admin/productos" element={<VerProductos />} />
        <Route path="/admin/categorias-atributos" element={<CategoriasAtributos />} />
      </Routes>
    </Router>
  );
}

export default App;