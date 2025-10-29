import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Usuario } from '../../services/types';

interface UsuariosResponse {
  usuarios: Usuario[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const VerUsuarios: React.FC = () => {
  const navigate = useNavigate();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // ✅ Término actualmente aplicado
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);

  const usersPerPage = 10;

  // Cargar usuarios - cuando cambie la página o el filtro activo
  useEffect(() => {
    loadUsuarios();
  }, [currentPage, activeSearchTerm]); // ✅ Usa activeSearchTerm, no searchTerm

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el término de búsqueda activo, no el que está siendo escrito
      const searchParam = activeSearchTerm.trim() ? `&search=${encodeURIComponent(activeSearchTerm)}` : '';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/usuarios.php?action=list-all&page=${currentPage}&limit=${usersPerPage}${searchParam}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      // ✅ Debug: Log para ver qué está recibiendo el backend
      console.log('🔍 Búsqueda enviada:', activeSearchTerm);
      console.log('📡 URL:', response.url);
      console.log('📥 Respuesta:', result);

      if (result.success && result.data) {
        setUsuarios(result.data.usuarios || []);
        setTotalUsuarios(result.data.pagination?.total || 0);
        setTotalPages(result.data.pagination?.pages || 0);
        setAccessDenied(false);
      } else {
        if (response.status === 403) {
          setAccessDenied(true);
          setError('Acceso denegado. Solo administradores pueden ver esta página.');
        } else {
          setError(result.error || 'Error al cargar usuarios');
        }
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearchTerm(searchTerm); // ✅ Activar el filtro
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm(''); // ✅ Limpiar el filtro activo
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getTypeClass = (tipoId: number) => {
    return tipoId === 2 
      ? 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  // ✅ ELIMINADA la función getStatusClass porque ya no se usa

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra todos los usuarios registrados en el sistema
            </p>
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
                  placeholder="Buscar por nombre, apellido, email, empresa o CUIT..."
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
                    {totalUsuarios} resultado{totalUsuarios !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>Total: {totalUsuarios} usuarios</>
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
                    onClick={() => loadUsuarios()}
                    className="mt-2 text-sm text-red-600 hover:text-red-500"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de usuarios */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando usuarios...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No se encontraron usuarios</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        {/* ✅ ELIMINADA LA COLUMNA "ESTADO" */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {usuario.nombre} {usuario.apellido}
                              </div>
                              <div className="text-sm text-gray-500">
                                {usuario.correo_electronico}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {usuario.razon_social_empresa || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {usuario.cuit || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {usuario.celular || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {usuario.ciudad ? `${usuario.ciudad}, ${usuario.provincia}` : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getTypeClass(usuario.tipo_usuario_id)}>
                              {usuario.tipo_usuario_id === 2 ? 'Admin' : 'Usuario'}
                            </span>
                          </td>
                          {/* ✅ ELIMINADA LA CELDA DEL ESTADO */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(usuario.created_at)}
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
                          Mostrando <span className="font-medium">{((currentPage - 1) * usersPerPage) + 1}</span> a{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * usersPerPage, totalUsuarios)}
                          </span>{' '}
                          de <span className="font-medium">{totalUsuarios}</span> usuarios
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
      <Footer />
    </>
  );
};

export default VerUsuarios;