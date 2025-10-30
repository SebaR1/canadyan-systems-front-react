import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ProductoModal from './ProductoModal';
import { Producto } from '../../services/types';

interface ProductosResponse {
  productos: Producto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const VerProductos: React.FC = () => {
  const navigate = useNavigate();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Estados del modal
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

  const productsPerPage = 10;

  // Cargar productos - cuando cambie la página o el filtro activo
  useEffect(() => {
    loadProductos();
  }, [currentPage, activeSearchTerm]);

  const loadProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParam = activeSearchTerm.trim() ? `&search=${encodeURIComponent(activeSearchTerm)}` : '';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/productos.php?action=list-admin&page=${currentPage}&limit=${productsPerPage}${searchParam}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();

      if (result.success && result.data) {
        setProductos(result.data.productos || []);
        setTotalProductos(result.data.pagination?.total || 0);
        setTotalPages(result.data.pagination?.pages || 0);
        setAccessDenied(false);
      } else {
        if (response.status === 403) {
          setAccessDenied(true);
          setError('Acceso denegado. Solo administradores pueden ver esta página.');
        } else {
          setError(result.error || 'Error al cargar productos');
        }
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error de conexión al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      setChangingStatus(productId);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/productos.php?action=toggle&id=${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo: !currentStatus })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProductos(prev => 
          prev.map(p => 
            p.id === productId 
              ? { ...p, activo: !currentStatus }
              : p
          )
        );
      } else {
        setError(result.error || 'Error al cambiar el estado del producto');
      }
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError('Error de conexión al cambiar estado');
    } finally {
      setChangingStatus(null);
    }
  };

  // Manejar creación/edición de producto
  const handleProductoSubmit = async (data: any) => {
    try {
      const { producto, atributos } = data;
      
      // Determinar si es crear o actualizar
      const isEditing = editingProducto !== null;
      const url = isEditing 
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/productos.php?action=update&id=${editingProducto.id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/productos.php?action=create`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Crear producto primero
      const productoResponse = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(producto)
      });
      
      const productoResult = await productoResponse.json();
      
      if (!productoResult.success) {
        throw new Error(productoResult.error || 'Error al guardar producto');
      }

      // Obtener ID del producto (para crear) o usar el existente (para editar)
      const productoId = isEditing ? editingProducto.id : productoResult.data.producto.id;

      // Asignar atributos si hay alguno
      if (atributos.length > 0) {
        const atributosResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/atributos.php?action=assign-product`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            producto_id: productoId,
            atributos: atributos
          })
        });
        
        const atributosResult = await atributosResponse.json();
        
        if (!atributosResult.success) {
          console.warn('Error al asignar atributos:', atributosResult.error);
        }
      }

      // Recargar productos y cerrar modal
      await loadProductos();
      setShowProductoModal(false);
      setEditingProducto(null);
      
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      throw error; // Re-lanzar para que el modal lo maneje
    }
  };

  // Manejar apertura del modal para crear
  const handleCreateProducto = () => {
    setEditingProducto(null);
    setShowProductoModal(true);
  };

  // Manejar apertura del modal para editar
  const handleEditProducto = (producto: Producto) => {
    setEditingProducto(producto);
    setShowProductoModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowProductoModal(false);
    setEditingProducto(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getStatusClass = (activo: boolean) => {
    return activo
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Mostrar loading mientras carga
  if (loading && !accessDenied) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Mostrar acceso denegado si el backend rechaza
  if (accessDenied) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
              <h2 className="font-bold text-lg mb-2">Acceso Denegado</h2>
              <p className="mb-4">Solo administradores pueden acceder a esta página.</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Volver al Inicio
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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Header de la página */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Administra todos los productos del catálogo
                </p>
              </div>
              
              {/* Botón Agregar Producto */}
              <button
                onClick={handleCreateProducto}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Producto
              </button>
            </div>
          </div>

          {/* Barra de búsqueda y estadísticas */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              
              {/* Búsqueda */}
              <form onSubmit={handleSearch} className="flex space-x-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o descripción..."
                  className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Buscar
                </button>
                {activeSearchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Limpiar
                  </button>
                )}
              </form>

              {/* Estadísticas */}
              <div className="text-sm text-gray-500">
                {activeSearchTerm ? (
                  <>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs mr-2">
                      Filtrando: "{activeSearchTerm}"
                    </span>
                    {totalProductos} resultado{totalProductos !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>Total: {totalProductos} productos</>
                )}
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button 
                    onClick={() => loadProductos()}
                    className="mt-2 text-sm text-red-600 hover:text-red-500"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de productos */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando productos...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No se encontraron productos</p>
                {!activeSearchTerm && (
                  <button
                    onClick={handleCreateProducto}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Crear primer producto
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productos.map((producto) => (
                        <tr key={producto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {producto.imagen_url && (
                                <img 
                                  src={producto.imagen_url} 
                                  alt={producto.nombre}
                                  className="h-10 w-10 rounded-full object-cover mr-4"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  <Link 
                                    to={`/producto/${producto.id}`}
                                    className="hover:text-orange-600"
                                  >
                                    {truncateText(producto.nombre, 30)}
                                  </Link>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {truncateText(producto.descripcion, 40)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {producto.categoria_nombre || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(producto.precio)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              producto.stock > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {producto.stock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusClass(producto.activo)}>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(producto.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {/* Botón Editar */}
                            <button
                              onClick={() => handleEditProducto(producto)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>

                            {/* Botón cambiar estado */}
                            <button
                              onClick={() => toggleProductStatus(producto.id, producto.activo)}
                              disabled={changingStatus === producto.id}
                              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                producto.activo
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {changingStatus === producto.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Cambiando...
                                </>
                              ) : (
                                producto.activo ? 'Desactivar' : 'Activar'
                              )}
                            </button>

                            {/* Botón ver detalle */}
                            <Link
                              to={`/producto/${producto.id}`}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              Ver
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{((currentPage - 1) * productsPerPage) + 1}</span> a{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * productsPerPage, totalProductos)}
                          </span>{' '}
                          de <span className="font-medium">{totalProductos}</span> productos
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ‹
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ›
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Modal de Producto */}
      <ProductoModal
        isOpen={showProductoModal}
        onClose={handleCloseModal}
        onSubmit={handleProductoSubmit}
        editing={editingProducto}
      />
      
      <Footer />
    </>
  );
};

export default VerProductos;