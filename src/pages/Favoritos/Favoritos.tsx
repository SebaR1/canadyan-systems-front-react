import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ProductCard from '../../components/Cards/ProductCard/ProductCard';
import apiManager from '../../services/ApiIndex';
import { Producto } from '../../services/types';

const Favoritos: React.FC = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay usuario logueado, redirigir
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/');
      return;
    }

    cargarFavoritos();
  }, [navigate]);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      const response = await apiManager.favoritos.listar();
      if (response.success && response.data) {
        setProductos(response.data.productos);
      }
    } catch (e) {
      console.error('Error cargando favoritos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverFavorito = async (productoId: number) => {
    try {
      await apiManager.favoritos.eliminar(productoId);
      setProductos(prev => prev.filter(p => p.id !== productoId));
    } catch (e) {
      console.error('Error al remover favorito:', e);
    }
  };

  const formatearPrecio = (precio: number | null): string => {
    if (precio === null || precio === undefined) return '$...';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(precio);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-4 px-4">

          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-orange-500 transition-colors">Inicio</Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-medium">Mis Favoritos</span>
            </div>
          </nav>

          {/* Título */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-1">
                {productos.length} producto{productos.length !== 1 ? 's' : ''} guardado{productos.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando favoritos...</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && productos.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.716-1.607-2.377-2.733-4.313-2.733C5.648 3.75 3.5 5.765 3.5 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">No tienes productos guardados aún</h2>
              <p className="text-gray-500">Agrega productos a favoritos tocando el corazón en el catálogo o en la página de un producto.</p>
            </div>
          )}

          {/* Grid de productos */}
          {!loading && productos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
              {productos.map((producto) => (
                <ProductCard
                  key={producto.id}
                  id={producto.id}
                  image={
                    producto.imagen_principal_url
                      ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/${producto.imagen_principal_url}`
                      : undefined
                  }
                  title={producto.nombre}
                  description={producto.descripcion || ''}
                  price={formatearPrecio(producto.precio)}
                  stock={producto.stock}
                  isFavorito={true}
                  onToggleFavorito={() => handleRemoverFavorito(producto.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Favoritos;
