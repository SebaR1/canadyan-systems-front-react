import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegistroCliente from '../Modals/RegistroCliente/RegistroCliente';
import AccesoCliente from '../Modals/AccesoCliente/AccesoCliente';
import apiManager from '../../services/ApiIndex';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  tipo_usuario_id: number;
  tipo_usuario_nombre?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  slug: string;
  parent_id: number | null;
  children?: Categoria[];
  activo: boolean;
  fecha_creacion: string;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [showAccesoModal, setShowAccesoModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  
  // ✅ NUEVO: Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermMobile, setSearchTermMobile] = useState('');
  const [showSearchDesktop, setShowSearchDesktop] = useState(false);
  
  const navigate = useNavigate();

  // Verificar si hay usuario logueado al cargar el componente
  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
        }
      }
    };

    checkUser();

    // Escuchar cambios en localStorage (para cuando el usuario se loguee/desloguee)
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  // Cargar categorías desde la API
  useEffect(() => {
    const loadCategorias = async () => {
      setLoadingCategorias(true);
      try {
        const response = await apiManager.categorias.obtenerArbol();
        if (response.success && response.data) {
          setCategorias(response.data.tree || []);
        } else {
          console.error('Error al cargar categorías:', response.error);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCategorias(false);
      }
    };

    loadCategorias();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    setExpandedSubCategory(null);
  };

  const toggleSubCategory = (subCategory: string) => {
    setExpandedSubCategory(expandedSubCategory === subCategory ? null : subCategory);
  };

  const toggleDesktopDropdown = (dropdown: string) => {
    setDesktopDropdown(desktopDropdown === dropdown ? null : dropdown);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setExpandedCategory(null);
    setExpandedSubCategory(null);
    setDesktopDropdown(null);
    // ✅ NUEVO: Limpiar búsqueda mobile al cerrar menú
    setSearchTermMobile('');
  };

  const handleNavigation = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const handleCategoryNavigation = (categoriaId: number, categoriaNombre: string, categoriaSlug?: string) => {
    closeMenu();
    
    // Si tenemos el slug, usar URLs amigables
    if (categoriaSlug) {
      navigate(`/catalogo/${categoriaSlug}`);
    } else {
      // Fallback al formato antiguo (para compatibilidad)
      navigate(`/catalogo?categoria=${categoriaId}&nombre=${encodeURIComponent(categoriaNombre)}`);
    }
  };

  // ✅ NUEVO: Función para manejar búsqueda en MOBILE
  const handleSearchMobile = () => {
    const term = searchTermMobile.trim();
    if (term) {
      closeMenu();
      navigate(`/catalogo?busqueda=${encodeURIComponent(term)}`);
      setSearchTermMobile('');
    }
  };

  // ✅ NUEVO: Función para manejar búsqueda en DESKTOP
  const handleSearchDesktop = () => {
    const term = searchTerm.trim();
    if (term) {
      navigate(`/catalogo?busqueda=${encodeURIComponent(term)}`);
      setSearchTerm('');
      setShowSearchDesktop(false);
    }
  };

  // ✅ NUEVO: Manejar Enter en input mobile
  const handleKeyDownMobile = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchMobile();
    }
  };

  // ✅ NUEVO: Manejar Enter en input desktop
  const handleKeyDownDesktop = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchDesktop();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowUserDropdown(false);
    navigate('/');
  };

  const isAdmin = () => {
    return user?.tipo_usuario_id === 2;
  };

  return (
    <>
      <header className="w-full relative z-50">
        {/* Sección superior negra */}
        <div className="bg-black text-white py-0.4 px-2">
          <div className="flex justify-end lg:justify-between items-center gap-1 text-xs">
            {/* Email - Solo visible en desktop */}
            <div className="hidden lg:flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="text-white text-lg">ventas@canadian.com.ar</span>
            </div>
            
            {/* Botones derecha - Dinámicos según estado de login */}
            <div className="flex gap-1 items-center">
              {user ? (
                // Usuario logueado
                <div className="relative">
                  <button 
                    className="text-white text-lg hover:text-gray-300 transition-colors py-1 flex items-center gap-2"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <span>👤 {user.nombre} {user.apellido}</span>
                    <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown del usuario */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white text-black rounded-md shadow-lg min-w-64 z-50">
                      <div className="p-3 border-b border-gray-200">
                        <p className="font-semibold">{user.nombre} {user.apellido}</p>
                        <p className="text-sm text-gray-600">{user.correo_electronico}</p>
                        <p className="text-xs text-gray-500">{user.tipo_usuario_nombre || 'Usuario'}</p>
                      </div>
                      
                      <div className="py-1">
                        <button 
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setShowUserDropdown(false);
                            navigate('/perfil');
                          }}
                        >
                          👤 Mi Perfil
                        </button>
                        
                        {/* Menú de Admin - Solo si es admin */}
                        {isAdmin() && (
                          <>
                            <div className="border-t border-gray-200 my-1"></div>
                            <div className="px-3 py-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase">Panel de Administración</p>
                            </div>
                            
                            <button 
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-blue-600"
                              onClick={() => {
                                setShowUserDropdown(false);
                                navigate('/admin/users');
                              }}
                            >
                              👥 Ver Usuarios
                            </button>
                            
                            <button 
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-blue-600"
                              onClick={() => {
                                setShowUserDropdown(false);
                                navigate('/admin/products');
                              }}
                            >
                              📦 Crear Productos
                            </button>
                          </>
                        )}
                        
                        <div className="border-t border-gray-200 my-1"></div>
                        <button 
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-red-600"
                          onClick={handleLogout}
                        >
                          🚪 Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Usuario no logueado - Botones originales
                <>
                  <button 
                    className="text-white text-lg active:text-gray-300 transition-colors py-1"
                    onClick={() => setShowRegistroModal(true)}
                  >
                    👤 Quiero ser cliente
                  </button>
                  <span className="text-gray-400 text-2xl">|</span>
                  <button 
                    className="text-white text-lg active:text-gray-300 transition-colors py-1"
                    onClick={() => setShowAccesoModal(true)}
                  >
                    Acceso cliente
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sección inferior gris oscura */}
        <div className="bg-gray-500 text-white py-2 px-3">
          <div className="flex items-center justify-between">
            {/* Menú hamburguesa - Solo visible en mobile */}
            <button 
              onClick={toggleMenu}
              className="md:hidden active:bg-gray-600 rounded transition-colors touch-manipulation"
            >
              <div className="w-5 h-8 flex flex-col justify-center items-center">
                <div className="w-8 h-1.5 bg-white mb-1 rounded"></div>
                <div className="w-8 h-1.5 bg-white mb-1 rounded"></div>
                <div className="w-8 h-1.5 bg-white rounded"></div>
              </div>
            </button>

            {/* Logo */}
            <div className="flex-1 flex justify-start px-4 md:flex-initial">
              <Link to="/">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="h-9 max-w-20"
                />
              </Link>
            </div>

            {/* Menú horizontal - Solo visible en desktop */}
            <nav className="hidden md:flex flex-1 justify-start pl-5 space-x-6">
              {/* CATÁLOGO - Ahora dinámico */}
              <div className="relative">
                <button 
                  className="text-white hover:text-orange-400 transition-colors py-2 flex items-center space-x-1"
                  onClick={() => toggleDesktopDropdown('catalogo')}
                >
                  <span>CATÁLOGO</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown CATÁLOGO - Categorías dinámicas */}
                {desktopDropdown === 'catalogo' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-black text-white rounded-md shadow-lg z-50">
                    <div className="py-2">
                      {loadingCategorias ? (
                        <div className="px-4 py-2 text-gray-400 text-sm">Cargando categorías...</div>
                      ) : categorias.length > 0 ? (
                        // Mostrar categorías principales (nivel 1) y sus hijas (nivel 2)
                        categorias.map((categoria) => (
                          <div key={categoria.id}>
                            {/* Categoría principal */}
                            <button 
                              className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors uppercase font-semibold"
                              onClick={() => {
                                handleCategoryNavigation(categoria.id, categoria.nombre, categoria.slug);
                                setDesktopDropdown(null);
                              }}
                            >
                              {categoria.nombre}
                            </button>
                            
                            {/* Subcategorías (nivel 2) - con indentación */}
                            {categoria.children && categoria.children.length > 0 && (
                              <div className="ml-2">
                                {categoria.children.map((subcategoria) => (
                                  <button 
                                    key={subcategoria.id}
                                    className="block w-full text-left px-4 py-1 hover:bg-gray-700 transition-colors text-sm text-gray-300"
                                    onClick={() => {
                                      // Para subcategorías necesitamos tanto el padre como la subcategoría
                                      handleCategoryNavigation(subcategoria.id, subcategoria.nombre, `${categoria.slug}/${subcategoria.slug}`);
                                      setDesktopDropdown(null);
                                    }}
                                  >
                                    {subcategoria.nombre}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-400 text-sm">No hay categorías disponibles</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MARCAS - Mantengo igual que tenías */}
              <div className="relative">
                <button 
                  className="text-white hover:text-orange-400 transition-colors py-2 flex items-center space-x-1"
                  onClick={() => toggleDesktopDropdown('marcas')}
                >
                  <span>MARCAS</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown MARCAS */}
                {desktopDropdown === 'marcas' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-black text-white rounded-md shadow-lg z-50">
                    <div className="py-2">
                      <Link 
                        to="/catalogo" 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                        onClick={() => setDesktopDropdown(null)}
                      >
                        Hikvision
                      </Link>
                      <Link 
                        to="/catalogo" 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                        onClick={() => setDesktopDropdown(null)}
                      >
                        Dahua
                      </Link>
                      <Link 
                        to="/catalogo" 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                        onClick={() => setDesktopDropdown(null)}
                      >
                        Ubiquiti
                      </Link>
                      <Link 
                        to="/catalogo" 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                        onClick={() => setDesktopDropdown(null)}
                      >
                        TP-Link
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* CONTACTO */}
              <Link 
                to="/contacto" 
                className="text-white hover:text-orange-400 transition-colors py-2"
              >
                CONTACTO
              </Link>
            </nav>

            {/* ✅ MODIFICADO: Iconos de búsqueda y carrito en DESKTOP */}
            <div className="flex items-center gap-1">
              {/* Búsqueda Desktop - Ahora es expandible */}
              <div className="relative">
                {showSearchDesktop ? (
                  // Input expandido
                  <div className="flex items-center bg-white rounded-full px-3 py-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDownDesktop}
                      placeholder="Buscar productos..."
                      className="w-48 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={handleSearchDesktop}
                      className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        setShowSearchDesktop(false);
                        setSearchTerm('');
                      }}
                      className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  // Botón de lupa
                  <button 
                    onClick={() => setShowSearchDesktop(true)}
                    className="p-2 active:bg-gray-600 rounded transition-colors touch-manipulation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay para cerrar el menú */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Menú lateral deslizable */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gray-500 text-white transform transition-transform duration-300 ease-in-out z-50 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* ✅ MODIFICADO: Barra de búsqueda MOBILE funcional */}
        <div className="p-4 border-b border-gray-400">
          <div className="relative">
            <input
              type="text"
              value={searchTermMobile}
              onChange={(e) => setSearchTermMobile(e.target.value)}
              onKeyDown={handleKeyDownMobile}
              placeholder="Buscar productos..."
              className="w-full bg-gray-400 text-white placeholder-gray-200 border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button 
              onClick={handleSearchMobile}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navegación del menú */}
        <nav className="p-4 space-y-2">
          
          {/* INICIO */}
          <button 
            className="w-full text-left py-3 px-2 text-white hover:bg-gray-400 rounded transition-colors"
            onClick={() => handleNavigation('/')}
          >
            INICIO
          </button>

          {/* CATÁLOGO - Menú móvil con categorías dinámicas */}
          <div>
            <button 
              className="w-full text-left py-3 px-2 text-white hover:bg-gray-400 rounded transition-colors flex items-center justify-between"
              onClick={() => toggleCategory('catalogo')}
            >
              <span>CATÁLOGO</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'catalogo' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Subcategorías de CATÁLOGO - Dinámicas */}
            {expandedCategory === 'catalogo' && (
              <div className="ml-4 mt-2 space-y-1">
                {loadingCategorias ? (
                  <div className="py-2 px-2 text-sm text-gray-400">Cargando categorías...</div>
                ) : categorias.length > 0 ? (
                  categorias.map((categoria) => (
                    <div key={categoria.id}>
                      {/* Categoría principal - Expandible si tiene hijos */}
                      <div>
                        <button 
                          className="w-full text-left py-2 px-2 text-sm text-gray-200 hover:bg-gray-400 rounded transition-colors flex items-center justify-between"
                          onClick={() => {
                            if (categoria.children && categoria.children.length > 0) {
                              toggleSubCategory(`categoria-${categoria.id}`);
                            } else {
                              handleCategoryNavigation(categoria.id, categoria.nombre, categoria.slug);
                            }
                          }}
                        >
                          <span className="uppercase">{categoria.nombre}</span>
                          {categoria.children && categoria.children.length > 0 && (
                            <svg 
                              className={`w-3 h-3 transition-transform duration-200 ${
                                expandedSubCategory === `categoria-${categoria.id}` ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Subcategorías nivel 2 */}
                        {expandedSubCategory === `categoria-${categoria.id}` && categoria.children && (
                          <div className="ml-4 mt-1 space-y-1">
                            {categoria.children.map((subcategoria) => (
                              <button 
                                key={subcategoria.id}
                                className="w-full text-left py-1.5 px-2 text-xs text-gray-300 hover:bg-gray-400 rounded transition-colors"
                                onClick={() => handleCategoryNavigation(subcategoria.id, subcategoria.nombre, `${categoria.slug}/${subcategoria.slug}`)}
                              >
                                {subcategoria.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-2 text-sm text-gray-400">No hay categorías disponibles</div>
                )}
              </div>
            )}
          </div>

          {/* MARCAS - Mantengo igual */}
          <div>
            <button 
              className="w-full text-left py-3 px-2 text-white hover:bg-gray-400 rounded transition-colors flex items-center justify-between"
              onClick={() => toggleCategory('marcas')}
            >
              <span>MARCAS</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'marcas' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Submarcas */}
            {expandedCategory === 'marcas' && (
              <div className="ml-4 mt-2 space-y-1">
                <button 
                  className="w-full text-left py-2 px-2 text-sm text-gray-200 hover:bg-gray-400 rounded transition-colors"
                  onClick={() => handleNavigation('/catalogo')}
                >
                  Hikvision
                </button>
                <button 
                  className="w-full text-left py-2 px-2 text-sm text-gray-200 hover:bg-gray-400 rounded transition-colors"
                  onClick={() => handleNavigation('/catalogo')}
                >
                  Dahua
                </button>
                <button 
                  className="w-full text-left py-2 px-2 text-sm text-gray-200 hover:bg-gray-400 rounded transition-colors"
                  onClick={() => handleNavigation('/catalogo')}
                >
                  Ubiquiti
                </button>
                <button 
                  className="w-full text-left py-2 px-2 text-sm text-gray-200 hover:bg-gray-400 rounded transition-colors"
                  onClick={() => handleNavigation('/catalogo')}
                >
                  TP-Link
                </button>
              </div>
            )}
          </div>

          {/* CONTACTO */}
          <button 
            className="w-full text-left py-3 px-2 text-white hover:bg-gray-400 rounded transition-colors"
            onClick={() => handleNavigation('/contacto')}
          >
            CONTACTO
          </button>

        </nav>
      </div>

      {/* Modal de Registro Cliente */}
      <RegistroCliente 
        isOpen={showRegistroModal}
        onClose={() => setShowRegistroModal(false)}
      />

      {/* Modal de Acceso Cliente */}
      <AccesoCliente 
        isOpen={showAccesoModal}
        onClose={() => setShowAccesoModal(false)}
      />
    </>
  );
};

export default Header;