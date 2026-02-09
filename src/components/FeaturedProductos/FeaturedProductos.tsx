import React, { useEffect, useState } from 'react';
import ProductCard from '../Cards/ProductCard/ProductCard';
import apiService from '../../services/ApiIndex';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number | null;
  stock: number;
  imagen_principal_url?: string;
}

const FeaturedProducts: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const response = await apiService.productos.obtenerDestacados(6);
        
        if (response.success && response.data) {
          setProductos(response.data.productos || []);
        } else {
          setError('Error al cargar productos destacados');
        }
      } catch (err) {
        console.error('Error cargando productos destacados:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const formatearPrecio = (precio: number | null): string => {
    if (precio === null) return 'Precio a consultar';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  if (loading) {
    return (
      <section className="bg-gray-50 py-12 px-4">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Productos destacados
          </h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </section>
    );
  }

  if (error || productos.length === 0) {
    return null; // No mostrar la sección si hay error o no hay productos
  }

  return (
    <section className="bg-gray-50 py-12 px-4">
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Productos destacados
        </h2>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ✅ Grid responsive con justify-center para centrar cuando hay pocos items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 justify-items-center">
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
              className="w-full max-w-sm" // ✅ Limitar ancho máximo de cada card
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;