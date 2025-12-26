import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import CategoriaModal from './CategoriaModal';
import AtributoModal from './AtributoModal';

// Interfaces
interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  parent_id: number | null;
  children?: Categoria[];
  productos_count?: number;
}

interface Atributo {
  id: number;
  nombre: string;
  tipo: 'text' | 'select' | 'number' | 'boolean';
  created_at: string;
  productos_count?: number;
}

const CategoriasAtributos: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null);

  // Estados para atributos
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [loadingAtributos, setLoadingAtributos] = useState(true);
  const [errorAtributos, setErrorAtributos] = useState<string | null>(null);

  // Estado de acceso
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Estados de modales
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showAtributoModal, setShowAtributoModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [editingAtributo, setEditingAtributo] = useState<Atributo | null>(null);
  
  // Estados de mobile tabs
  const [activeTab, setActiveTab] = useState<'categorias' | 'atributos'>('categorias');
  
  // Verificar autenticación de admin
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.tipo_usuario_id !== 2) {
      navigate('/');
      return;
    }

    loadCategorias();
    loadAtributos();
  }, [navigate]);

  // Cargar categorías
  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true);
      setErrorCategorias(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/categorias.php?action=tree`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Verificar acceso denegado
      if (response.status === 403) {
        setAccessDenied(true);
        setErrorCategorias('Acceso denegado. Solo administradores pueden ver esta página.');
        return;
      }

      const result = await response.json();
      console.log('🗂️ Respuesta categorías:', result);

      if (result.success && result.data) {
        setCategorias(result.data.tree || []);
      } else {
        throw new Error(result.error || 'Error al cargar categorías');
      }
    } catch (error: any) {
      console.error('Error cargando categorías:', error);
      setErrorCategorias(error.message || 'Error de conexión');
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Cargar atributos
  const loadAtributos = async () => {
    try {
      setLoadingAtributos(true);
      setErrorAtributos(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/atributos.php?action=list`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Verificar acceso denegado
      if (response.status === 403) {
        setAccessDenied(true);
        setErrorAtributos('Acceso denegado. Solo administradores pueden ver esta página.');
        return;
      }

      const result = await response.json();
      console.log('🏷️ Respuesta atributos modal:', result);

      if (result.success) {
        // ✅ CORREGIDO: Buscar en result.data.atributos igual que en CategoriasAtributos
        setAtributos(result.data?.atributos || []);
      }
    } catch (error) {
      console.error('Error cargando atributos:', error);
    } finally {
      setLoadingAtributos(false);
    }
  };

  // Manejar creación/edición de categoría
  const handleCategoriaSubmit = async (data: { nombre: string; parent_id?: number }) => {
    try {
      const url = editingCategoria 
        ? `/api/routes/categorias.php?action=update&id=${editingCategoria.id}`
        : '/api/routes/categorias.php?action=create';
      
      const method = editingCategoria ? 'PUT' : 'POST';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${url}`, {
        method,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadCategorias(); // Recargar lista
        setShowCategoriaModal(false);
        setEditingCategoria(null);
      } else {
        throw new Error(result.error || 'Error al guardar categoría');
      }
    } catch (error: any) {
      console.error('Error guardando categoría:', error);
      alert('Error: ' + error.message);
    }
  };

  // Manejar creación/edición de atributo
  const handleAtributoSubmit = async (data: { nombre: string; tipo: string }) => {
    try {
      const url = editingAtributo 
        ? `/api/routes/atributos.php?action=update&id=${editingAtributo.id}`
        : '/api/routes/atributos.php?action=create';
      
      const method = editingAtributo ? 'PUT' : 'POST';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${url}`, {
        method,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadAtributos(); // Recargar lista
        setShowAtributoModal(false);
        setEditingAtributo(null);
      } else {
        throw new Error(result.error || 'Error al guardar atributo');
      }
    } catch (error: any) {
      console.error('Error guardando atributo:', error);
      alert('Error: ' + error.message);
    }
  };

  // Eliminar categoría
  const handleDeleteCategoria = async (categoria: Categoria) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/categorias.php?action=delete&id=${categoria.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadCategorias();
      } else {
        throw new Error(result.error || 'Error al eliminar categoría');
      }
    } catch (error: any) {
      console.error('Error eliminando categoría:', error);
      alert('Error: ' + error.message);
    }
  };

  // Eliminar atributo
  const handleDeleteAtributo = async (atributo: Atributo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el atributo "${atributo.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/atributos.php?action=delete&id=${atributo.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadAtributos();
      } else {
        throw new Error(result.error || 'Error al eliminar atributo');
      }
    } catch (error: any) {
      console.error('Error eliminando atributo:', error);
      alert('Error: ' + error.message);
    }
  };

  // Renderizar árbol de categorías
  const renderCategoriaTree = (cats: Categoria[], level: number = 0) => {
    return cats.map((categoria) => (
      <div key={categoria.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        {/* Categoría actual */}
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg mb-2 shadow-sm">
          <div className="flex items-center space-x-2">
            {level > 0 && (
              <span className="text-gray-400">└─</span>
            )}
            <div>
              <h4 className="font-medium text-gray-900">{categoria.nombre}</h4>
              <p className="text-sm text-gray-500">
                {categoria.productos_count || 0} productos
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingCategoria(categoria);
                setShowCategoriaModal(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDeleteCategoria(categoria)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Subcategorías */}
        {categoria.children && categoria.children.length > 0 && (
          <div>
            {renderCategoriaTree(categoria.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'text': 'Texto',
      'select': 'Selección',
      'number': 'Número',
      'boolean': 'Sí/No'
    };
    return tipos[tipo] || tipo;
  };

  // Si el acceso fue denegado, mostrar página de error
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta página. Solo los administradores pueden gestionar categorías y atributos.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Header de la página */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías y Atributos</h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra las categorías jerárquicas y atributos globales del sistema
            </p>
          </div>

          {/* Tabs para mobile */}
          <div className="lg:hidden mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('categorias')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'categorias'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => setActiveTab('atributos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'atributos'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Atributos
                </button>
              </nav>
            </div>
          </div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LADO IZQUIERDO - Categorías */}
            <div className={`${activeTab === 'categorias' ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-white rounded-lg shadow">
                {/* Header de categorías */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Categorías</h2>
                      <p className="text-sm text-gray-500">Estructura jerárquica padre-hijo</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCategoria(null);
                        setShowCategoriaModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Nueva Categoría
                    </button>
                  </div>
                </div>

                {/* Contenido de categorías */}
                <div className="p-6">
                  {loadingCategorias ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <span className="ml-2 text-gray-600">Cargando categorías...</span>
                    </div>
                  ) : errorCategorias ? (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-2">{errorCategorias}</div>
                      <button
                        onClick={loadCategorias}
                        className="text-sm text-orange-600 hover:text-orange-500"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  ) : categorias.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay categorías creadas
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {renderCategoriaTree(categorias)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LADO DERECHO - Atributos */}
            <div className={`${activeTab === 'atributos' ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-white rounded-lg shadow">
                {/* Header de atributos */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Atributos</h2>
                      <p className="text-sm text-gray-500">Campos globales para productos</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAtributo(null);
                        setShowAtributoModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Nuevo Atributo
                    </button>
                  </div>
                </div>

                {/* Contenido de atributos */}
                <div className="p-6">
                  {loadingAtributos ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      <span className="ml-2 text-gray-600">Cargando atributos...</span>
                    </div>
                  ) : errorAtributos ? (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-2">{errorAtributos}</div>
                      <button
                        onClick={loadAtributos}
                        className="text-sm text-green-600 hover:text-green-500"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  ) : atributos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay atributos creados
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {atributos.map((atributo) => (
                        <div key={atributo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{atributo.nombre}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getTipoLabel(atributo.tipo)}
                              </span>
                              <span>{atributo.productos_count || 0} productos</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingAtributo(atributo);
                                setShowAtributoModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAtributo(atributo)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modales */}
      {showCategoriaModal && (
        <CategoriaModal
          isOpen={showCategoriaModal}
          onClose={() => {
            setShowCategoriaModal(false);
            setEditingCategoria(null);
          }}
          onSubmit={handleCategoriaSubmit}
          editing={editingCategoria}
          categorias={categorias}
        />
      )}

      {showAtributoModal && (
        <AtributoModal
          isOpen={showAtributoModal}
          onClose={() => {
            setShowAtributoModal(false);
            setEditingAtributo(null);
          }}
          onSubmit={handleAtributoSubmit}
          editing={editingAtributo}
        />
      )}
    </>
  );
};

export default CategoriasAtributos;