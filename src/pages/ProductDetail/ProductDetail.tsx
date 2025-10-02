import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import apiManager from '../../services/ApiIndex';
import { Producto } from '../../services/types';

interface CategoriaInfo {
  id: number;
  nombre: string;
  parent_id?: number | null;
  padre_nombre?: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [categoriaInfo, setCategoriaInfo] = useState<CategoriaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'caracteristicas' | 'descargas' | 'videos'>('caracteristicas');

  useEffect(() => {
    if (!id || !Number.isInteger(Number(id))) {
      setError('ID de producto inválido');
      setLoading(false);
      return;
    }

    cargarProducto();
  }, [id]);

  const cargarProducto = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiManager.productos.obtenerPorId(Number(id));
      
      if (response.success && response.data) {
        setProducto((response.data as any).producto);
        
        // Si hay categoría, obtener información adicional
        if ((response.data as any).producto.categoria_id) {
          await cargarCategoriaInfo((response.data as any).producto.categoria_id);
        }

        // Cargar atributos del producto
        const atributosResponse = await apiManager.atributos.obtenerPorProducto(Number(id));
        if (atributosResponse.success && atributosResponse.data) {
          setProducto(prev => ({ 
            ...prev, 
            atributos: (atributosResponse.data as any).atributos 
          } as any));
        }
      } else {
        setError('Producto no encontrado');
      }
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const cargarCategoriaInfo = async (categoriaId: number) => {
    try {
      const response = await apiManager.categorias.obtenerPorId(categoriaId);
      if (response.success && response.data) {
        const categoria = response.data.categoria;
        
        // Si tiene padre, cargar también la información del padre
        let padre_nombre = undefined;
        if (categoria.parent_id) {
          const padreResponse = await apiManager.categorias.obtenerPorId(categoria.parent_id);
          if (padreResponse.success && padreResponse.data) {
            padre_nombre = padreResponse.data.categoria.nombre;
          }
        }
        
        setCategoriaInfo({
          id: categoria.id,
          nombre: categoria.nombre,
          parent_id: categoria.parent_id,
          padre_nombre: padre_nombre
        });
      }
    } catch (err) {
      console.error('Error al cargar categoría:', err);
    }
  };

  const formatearPrecio = (precio: number | null): string => {
    if (precio === null || precio === undefined) {
      return '$...';
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(precio);
  };

  const handleComprar = () => {
    // Por ahora redirigir a contacto con el producto como contexto
    navigate('/contacto', { 
      state: { 
        producto: producto?.nombre,
        codigo: (producto as any)?.sku 
      } 
    });
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-4">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando producto...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !producto) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-4">
            <div className="text-center text-red-600 p-8">
              <p>Error: {error || 'Producto no encontrado'}</p>
              <button 
                onClick={() => navigate('/catalogo')} 
                className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Volver al catálogo
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-4 px-4">
          
          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </Link>
              <span>&gt;</span>
              <Link to="/catalogo" className="hover:text-orange-500 transition-colors">
                Catálogo
              </Link>
              
              {categoriaInfo && (
                <>
                  {/* Si tiene categoría padre */}
                  {categoriaInfo.parent_id && categoriaInfo.padre_nombre && (
                    <>
                      <span>&gt;</span>
                      <Link 
                        to={`/catalogo?categoria=${categoriaInfo.parent_id}&nombre=${encodeURIComponent(categoriaInfo.padre_nombre)}`}
                        className="hover:text-orange-500 transition-colors"
                      >
                        {categoriaInfo.padre_nombre}
                      </Link>
                    </>
                  )}
                  
                  {/* Categoría actual */}
                  <span>&gt;</span>
                  <Link 
                    to={`/catalogo?categoria=${categoriaInfo.id}&nombre=${encodeURIComponent(categoriaInfo.nombre)}`}
                    className="hover:text-orange-500 transition-colors"
                  >
                    {categoriaInfo.nombre}
                  </Link>
                </>
              )}
              
              <span>&gt;</span>
              <span className="text-gray-900 font-medium">
                {producto.nombre}
              </span>
            </div>
          </nav>

          {/* Contenido principal */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Imagen del producto */}
              <div className="flex justify-center">
                <div className="w-full max-w-md bg-gray-50 rounded-2xl border-2 border-gray-300 p-6 flex items-center justify-center min-h-80">
                  <img
                    src={producto.imagen_url || `https://picsum.photos/400/300?random=${producto.id}`}
                    alt={producto.nombre}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Información del producto */}
              <div className="space-y-6">
                
                {/* Título */}
                <h1 className="text-2xl font-bold text-gray-900">
                  {producto.nombre}
                </h1>

                  {/* Información adicional */}
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="font-semibold text-gray-700 w-20">CÓDIGO:</span>
                    <span className="text-gray-600">
                      {(producto as any).sku || `PROD-${producto.id}`}
                    </span>
                  </div>
                   <div className="flex">
                    <span className="font-semibold text-gray-700 w-20">MARCA:</span>
                    <span className="text-gray-600">
                      {(producto as any).atributos?.find((attr: any) => 
                        attr.atributo_nombre && attr.atributo_nombre.toLowerCase() === 'marca'
                      )?.valor || '---'}
                    </span>
                  </div>
                </div>

                {/* Precio */}
                <div className="text-3xl font-bold text-orange-600">
                  {formatearPrecio(producto.precio)}
                </div>

                {/* Botón Comprar */}
                <button
                  onClick={handleComprar}
                  className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-200 text-lg"
                >
                  COMPRAR
                </button>
              </div>
            </div>

            {/* Sección Descripción */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                DESCRIPCIÓN
              </h2>
              <p className="text-gray-600">
                {producto.descripcion}
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex space-x-0">
                <button
                  onClick={() => setActiveTab('caracteristicas')}
                  className={`px-6 py-3 font-semibold rounded-l-full transition-colors ${
                    activeTab === 'caracteristicas'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Características
                </button>
                <button
                  onClick={() => setActiveTab('descargas')}
                  className={`px-6 py-3 font-semibold transition-colors ${
                    activeTab === 'descargas'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Centro de descargas
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-6 py-3 font-semibold rounded-r-full transition-colors ${
                    activeTab === 'videos'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Videos
                </button>
              </div>

              {/* Contenido de tabs */}
              <div className="mt-6 p-6 bg-gray-50 rounded-2xl min-h-32">
                {activeTab === 'caracteristicas' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Especificaciones técnicas</h3>
                    {(producto as any).atributos && (producto as any).atributos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(producto as any).atributos.map((atributo: any, index: number) => (
                          <div key={atributo.atributo_id || index} className="flex">
                            <span className="font-medium text-gray-700 w-32">{atributo.atributo_nombre}:</span>
                            <span className="text-gray-600">{atributo.valor}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No hay características específicas disponibles.</p>
                    )}
                  </div>
                )}

                {activeTab === 'descargas' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Documentos y recursos</h3>
                    <p className="text-gray-500">Centro de descargas en desarrollo.</p>
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Videos del producto</h3>
                    <p className="text-gray-500">Videos en desarrollo.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;