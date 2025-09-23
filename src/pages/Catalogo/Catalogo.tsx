import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import apiManager from '../../services/ApiIndex';
import { AtributoConValores, Producto } from '../../services/types';

interface FilterState {
  [atributoId: string]: { [valor: string]: boolean };
}

const Catalogo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('precio');
  const [filters, setFilters] = useState<FilterState>({});
  const [productos, setProductos] = useState<Producto[]>([]);
  const [atributos, setAtributos] = useState<AtributoConValores[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar filtros y productos al montar el componente
  useEffect(() => {
    loadFiltrosYProductos();
  }, []);

  // Recargar productos cuando cambien los filtros
  useEffect(() => {
    if (atributos.length > 0) {
      loadProductos();
    }
  }, [filters]);

  const loadFiltrosYProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar filtros disponibles
      const filtrosResponse = await apiManager.atributos.obtenerFiltros();
      
      if (filtrosResponse.success && filtrosResponse.data) {
        const atributosData = filtrosResponse.data.filtros;
        setAtributos(atributosData);
        
        // Inicializar estado de filtros
        const initialFilters: FilterState = {};
        atributosData.forEach(atributo => {
          initialFilters[atributo.id.toString()] = {};
          atributo.valores.forEach(valor => {
            initialFilters[atributo.id.toString()][valor] = false;
          });
        });
        setFilters(initialFilters);
        
        // Cargar productos iniciales
        await loadProductosIniciales();
      } else {
        setError(filtrosResponse.error || 'Error al cargar filtros');
      }
    } catch (error) {
      console.error('Error loading filters and products:', error);
      setError('Error de conexión al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  const loadProductosIniciales = async () => {
    try {
      const categoriaId = searchParams.get('categoria');
      let productos: Producto[] = [];

      if (categoriaId) {
        // Filtrar por categoría
        const response = await apiManager.productos.obtenerPorCategoria(parseInt(categoriaId));
        if (response.success && response.data) {
          productos = response.data.items || response.data.productos || [];
        }
      } else {
        // Cargar todos los productos
        const response = await apiManager.productos.listar({ limit: 50 });
        if (response.success && response.data) {
          productos = response.data.items || response.data.productos || [];
        }
      }

      setProductos(productos);
    } catch (error) {
      console.error('Error loading initial products:', error);
    }
  };

  const loadProductos = async () => {
    try {
      setLoadingProductos(true);
      
      // Obtener filtros activos
      const filtrosActivos = getFiltrosActivos();
      
      let productos: Producto[] = [];

      if (Object.keys(filtrosActivos).length > 0) {
        // Filtrar por atributos
        const response = await apiManager.atributos.filtrarProductosSimple(filtrosActivos, 1, 50);
        
        if (response.success && response.data) {
          productos = response.data.productos;
        }
      } else {
        // Cargar productos iniciales sin filtros
        await loadProductosIniciales();
        return;
      }

      setProductos(productos);
      
    } catch (error) {
      console.error('Error filtering products:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const getFiltrosActivos = (): Record<string, string[]> => {
    const filtrosActivos: Record<string, string[]> = {};
    
    Object.entries(filters).forEach(([atributoId, valores]) => {
      const valoresActivos = Object.entries(valores)
        .filter(([_, activo]) => activo)
        .map(([valor, _]) => valor);
      
      if (valoresActivos.length > 0) {
        filtrosActivos[atributoId] = valoresActivos;
      }
    });
    
    return filtrosActivos;
  };

  const handleFilterChange = (atributoId: string, valor: string) => {
    setFilters(prev => ({
      ...prev,
      [atributoId]: {
        ...prev[atributoId],
        [valor]: !prev[atributoId][valor]
      }
    }));
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {};
    Object.keys(filters).forEach(atributoId => {
      clearedFilters[atributoId] = {};
      Object.keys(filters[atributoId]).forEach(valor => {
        clearedFilters[atributoId][valor] = false;
      });
    });
    setFilters(clearedFilters);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
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
                <p className="text-gray-600">Cargando catálogo...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-4">
            <div className="text-center text-red-600 p-8">
              <p>Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Recargar página
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
        <div className="max-w-7xl mx-auto py-4">
          
          {/* Breadcrumb */}
          <nav className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </Link>
              <span>&gt;</span>
              <Link to="/catalogo" className="hover:text-orange-500 transition-colors">
                Catálogo
              </Link>
              {searchParams.get('nombre') && (
                <>
                  <span>&gt;</span>
                  <span className="text-gray-900 font-medium">{searchParams.get('nombre')}</span>
                </>
              )}
            </div>
          </nav>

          <div className="flex gap-6">
            
            {/* Sidebar de filtros - Solo desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-gray-900">Filtros</h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-orange-500 hover:text-orange-700"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Filtros dinámicos */}
                {atributos.map((atributo) => (
                  <div key={atributo.id} className="mb-6">
                    <h3 className="font-bold text-sm text-orange-500 mb-3 uppercase">
                      {atributo.nombre}
                    </h3>
                    <div className="space-y-2">
                      {atributo.valores.map((valor) => (
                        <label key={valor} className="flex items-center space-x-2 text-xs">
                          <input
                            type="checkbox"
                            checked={filters[atributo.id.toString()]?.[valor] || false}
                            onChange={() => handleFilterChange(atributo.id.toString(), valor)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-gray-600">{valor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Mostrar mensaje si no hay filtros */}
                {atributos.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No hay filtros disponibles
                  </div>
                )}
              </div>
            </aside>

            {/* Área principal */}
            <div className="flex-1">
              
              {/* Barra de filtros mobile + ordenar */}
              <div className="flex justify-between items-center mb-6">
                
                {/* Botón filtrar - Solo mobile */}
                <button
                  onClick={toggleMobileFilters}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filtrar</span>
                </button>

                {/* Información de resultados */}
                <div className="text-sm text-gray-600">
                  {loadingProductos ? 'Filtrando...' : `${productos.length} productos`}
                </div>

                {/* Ordenar por */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="precio">Precio</option>
                    <option value="nombre">Nombre</option>
                    <option value="mas-vendido">Más vendido</option>
                    <option value="fecha">Más reciente</option>
                  </select>
                </div>
              </div>

              {/* Grid de productos */}
              {loadingProductos ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Filtrando productos...</p>
                  </div>
                </div>
              ) : productos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No se encontraron productos con los filtros seleccionados.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-orange-500 hover:text-orange-700 text-sm underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
                  {productos.map((producto) => (
                    <div key={producto.id} className="bg-white rounded-2xl border-2 border-gray-300 p-4 shadow-sm">
                      
                      {/* Imagen */}
                      <div className="flex justify-center mb-4">
                        <img
                          src={producto.imagen_url || `https://picsum.photos/300/200?random=${producto.id}`}
                          alt={producto.nombre}
                          className="w-full h-32 object-contain"
                        />
                      </div>

                      {/* Título */}
                      <h3 className="text-gray-800 font-semibold text-sm mb-2 leading-5">
                        {producto.nombre}
                      </h3>

                      {/* Descripción */}
                      <p className="text-gray-600 text-xs mb-4 leading-4">
                        {producto.descripcion}
                      </p>

                      {/* Precio */}
                      <div className="text-gray-800 font-medium text-sm mb-4">
                        {producto.precio ? `$${producto.precio.toFixed(2)}` : '$..........'}
                      </div>

                      {/* Botón */}
                      <div className="flex justify-center">
                        {producto.stock > 0 ? (
                          <button className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200 touch-manipulation text-sm">
                            VER MÁS
                          </button>
                        ) : (
                          <button className="bg-black text-white font-semibold py-2 px-6 rounded-full text-sm cursor-not-allowed">
                            SIN STOCK
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de filtros mobile */}
        {showMobileFilters && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={toggleMobileFilters}
            />
            
            {/* Panel de filtros */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-lg p-4 z-50 lg:hidden max-h-[80vh] overflow-y-auto">
              
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h3 className="font-bold text-lg">Filtros</h3>
                <button 
                  onClick={toggleMobileFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Contenido de filtros dinámicos */}
              <div className="space-y-6">
                {atributos.map((atributo) => (
                  <div key={atributo.id}>
                    <h4 className="font-bold text-sm text-orange-500 mb-3 uppercase">
                      {atributo.nombre}
                    </h4>
                    <div className="space-y-2">
                      {atributo.valores.map((valor) => (
                        <label key={valor} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters[atributo.id.toString()]?.[valor] || false}
                            onChange={() => handleFilterChange(atributo.id.toString(), valor)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-gray-600">{valor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones del modal */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button 
                  onClick={clearFilters}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium"
                >
                  Limpiar filtros
                </button>
                <button 
                  onClick={toggleMobileFilters}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Catalogo;