import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import apiManager from '../../services/ApiIndex';
import ProductCard from '../../components/Cards/ProductCard/ProductCard';
import { AtributoConValores, Producto, Categoria } from '../../services/types';


interface FilterState {
  [atributoId: string]: { [valor: string]: boolean };
}

const Catalogo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { categoriaSlug, subcategoriaSlug } = useParams();
  const navigate = useNavigate();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('precio');
  const [filters, setFilters] = useState<FilterState>({});
  const [productos, setProductos] = useState<Producto[]>([]);
  const [atributos, setAtributos] = useState<AtributoConValores[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActual, setCategoriaActual] = useState<{
    id: number;
    nombre: string;
    parent_id: number | null;
    padre_nombre?: string;
  } | null>(null);

  // NUEVOS ESTADOS para subcategorías
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<number | null>(null);

  // ✅ NUEVO: Estado para detectar modo búsqueda
  const terminoBusqueda = searchParams.get('busqueda');

  // FUNCIÓN HELPER PARA FORMATEAR PRECIO
  const formatearPrecio = (precio: any): string => {
    if (!precio || precio === '' || precio === null || precio === undefined) {
      return '$..........';
    }
    
    const precioNumerico = typeof precio === 'string' ? parseFloat(precio) : precio;
    
    if (isNaN(precioNumerico) || precioNumerico < 0) {
      return '$..........';
    }
    
    return `$${precioNumerico.toFixed(2)}`;
  };

  // NUEVA FUNCIÓN: Agregar en Catalogo.tsx antes de los useEffect
  const obtenerCategoriaPorSlug = useCallback(async (slug: string): Promise<Categoria | null> => {
    try {
      const response = await apiManager.categorias.listar();
      if (response.success && response.data) {
        const categoria = response.data.categorias.find((cat: Categoria) => cat.slug === slug);
        return categoria || null;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo categoría por slug:', error);
      return null;
    }
  }, []);

  // NUEVA FUNCIÓN: Manejar cambio de subcategoría (agregar después de obtenerCategoriaPorSlug)
  const handleSubcategoriaChange = async (subcategoriaId: string) => {
    if (subcategoriaId === '') {
      // "Todas las subcategorías" - ir a categoría padre usando slug
      if (categoriaActual) {
        // Si estoy en subcategoría, obtener el slug del padre
        if (categoriaActual.parent_id) {
          const padreResponse = await apiManager.categorias.obtenerPorId(categoriaActual.parent_id);
          if (padreResponse.success && padreResponse.data) {
            const padreSlug = padreResponse.data.categoria.slug;
            navigate(`/catalogo/${padreSlug}`);
          }
        } else {
          // Si ya estoy en categoría padre, usar su propio slug
          const categoria = await obtenerCategoriaPorSlug(categoriaSlug || '');
          if (categoria) {
            navigate(`/catalogo/${categoria.slug}`);
          }
        }
      }
    } else {
      // Subcategoría específica - buscar su slug y navegar
      const subcategoria = subcategorias.find(s => s.id === parseInt(subcategoriaId));
      if (subcategoria && categoriaActual) {
        // Obtener slug de la categoría padre
        let padreSlug = '';
        if (categoriaActual.parent_id) {
          const padreResponse = await apiManager.categorias.obtenerPorId(categoriaActual.parent_id);
          if (padreResponse.success && padreResponse.data) {
            padreSlug = padreResponse.data.categoria.slug;
          }
        } else {
          // categoriaActual es el padre
          const categoria = await obtenerCategoriaPorSlug(categoriaSlug || '');
          padreSlug = categoria?.slug || '';
        }
        
        navigate(`/catalogo/${padreSlug}/${subcategoria.slug}`);
      }
    }
    
    // Limpiar filtros actuales
    clearFilters();
  };

  // ✅ MODIFICADO: useEffect principal con detección de búsqueda
  useEffect(() => {
    const loadAllData = async () => {
      console.log('🔵 CARGA ÚNICA - useEffect principal');
      console.log('🔍 Término de búsqueda:', terminoBusqueda);
      setLoading(true);
      setError(null);

      try {
        // ✅ MODO BÚSQUEDA - Nueva lógica
        if (terminoBusqueda) {
          console.log('🔎 MODO BÚSQUEDA ACTIVADO');
          
          // Limpiar estados de categoría y filtros
          setCategoriaActual(null);
          setSubcategorias([]);
          setSubcategoriaSeleccionada(null);
          setAtributos([]);
          setFilters({});
          
          // Llamar a API de búsqueda
          const busquedaResponse = await apiManager.productos.buscar({ 
            q: terminoBusqueda,
            page: 1,
            limit: 50
          });
          
          if (busquedaResponse.success && busquedaResponse.data) {
            // El backend devuelve 'productos' directamente
            const productosEncontrados = (busquedaResponse.data as any).productos || [];
            setProductos(productosEncontrados);
            console.log('🔍 Resultados de búsqueda:', productosEncontrados.length);
          } else {
            setProductos([]);
            console.log('🔍 No se encontraron resultados');
          }
          
          setLoading(false);
          return; // ← IMPORTANTE: Salir aquí para no ejecutar lógica de categorías
        }

        // ✅ MODO NORMAL - Tu lógica existente
        console.log('📂 MODO CATEGORÍA NORMAL');
        
        // 1. Determinar categoría de la URL
        let categoriaId: string | null = null;
        
        if (categoriaSlug) {
          const categoria = subcategoriaSlug 
            ? await obtenerCategoriaPorSlug(subcategoriaSlug)
            : await obtenerCategoriaPorSlug(categoriaSlug);
          
          if (categoria) categoriaId = categoria.id.toString();
        }
        
        if (!categoriaId) {
          categoriaId = searchParams.get('categoria');
        }

        let productos: Producto[] = [];

        // 2. Cargar datos de categoría y productos
        if (categoriaId) {
          const categoriaResponse = await apiManager.categorias.obtenerPorId(parseInt(categoriaId));
          
          if (categoriaResponse.success && categoriaResponse.data) {
            const categoria = categoriaResponse.data.categoria;
            
            // Obtener nombre del padre si existe
            let padre_nombre = undefined;
            if (categoria.parent_id) {
              const padreResponse = await apiManager.categorias.obtenerPorId(categoria.parent_id);
              if (padreResponse.success && padreResponse.data) {
                padre_nombre = padreResponse.data.categoria.nombre;            
              }
            }
            
            setCategoriaActual({
              id: categoria.id,
              nombre: categoria.nombre,
              parent_id: categoria.parent_id,
              padre_nombre: padre_nombre
            });

            // Cargar subcategorías si es necesario
            if (!categoria.parent_id) {
              // Es categoría padre - cargar subcategorías
              const categoriasResponse = await apiManager.categorias.listar();
              if (categoriasResponse.success && categoriasResponse.data) {
                const subs = categoriasResponse.data.categorias.filter(
                  (cat: Categoria) => Number(cat.parent_id) === Number(categoria.id)
                );
                setSubcategorias(subs);
                
                // Cargar productos de todas las subcategorías
                if (subs.length > 0) {
                  const productosPromises = subs.map(sub => 
                    apiManager.productos.obtenerPorCategoria(sub.id)
                  );
                  const productosResponses = await Promise.all(productosPromises);
                  
                  for (const prodResponse of productosResponses) {
                    if (prodResponse.success && prodResponse.data) {
                      productos.push(...(prodResponse.data.productos || []));
                    }
                  }
                } else {
                  // Si no hay subcategorías, cargar productos de la categoría padre
                  const productosResponse = await apiManager.productos.obtenerPorCategoria(categoria.id);
                  if (productosResponse.success && productosResponse.data) {
                    productos = productosResponse.data.productos || [];
                  }
                }
              }
              setSubcategoriaSeleccionada(null);
              
            } else {
              // Es subcategoría - cargar subcategorías del padre
              const subcategoriasResponse = await apiManager.categorias.listar();
              if (subcategoriasResponse.success && subcategoriasResponse.data) {
                const subs = subcategoriasResponse.data.categorias.filter(
                  (cat: Categoria) => Number(cat.parent_id) === Number(categoria.parent_id)
                );
                setSubcategorias(subs);
              }
              setSubcategoriaSeleccionada(categoria.id);
              
              // Cargar productos de esta subcategoría específica
              const productosResponse = await apiManager.productos.obtenerPorCategoria(categoria.id);
              if (productosResponse.success && productosResponse.data) {
                productos = productosResponse.data.productos || [];
              }
            }
          }
          
        } else {
          // Sin categoría - limpiar y cargar todo
          setCategoriaActual(null);
          setSubcategorias([]);
          setSubcategoriaSeleccionada(null);
          
          const todosProductosResponse = await apiManager.productos.listar({ limit: 50 });
          if (todosProductosResponse.success && todosProductosResponse.data) {
            productos = todosProductosResponse.data.productos || [];
          }
        }

        setProductos(productos);
        console.log('🔍 Productos encontrados para categoría:', productos.length);

        
        // 3. Cargar filtros (solo en modo normal)
        const categoriaParaFiltros = categoriaId ? parseInt(categoriaId) : null;
        const filtrosResponse = await apiManager.atributos.obtenerFiltros(categoriaParaFiltros || undefined);
        
        if (filtrosResponse.success && filtrosResponse.data) {
          const atributosData = filtrosResponse.data.filtros;
          setAtributos(atributosData);
          
          const initialFilters: FilterState = {};
          atributosData.forEach(atributo => {
            initialFilters[atributo.id.toString()] = {};
            atributo.valores.forEach(valor => {
              initialFilters[atributo.id.toString()][valor] = false;
            });
          });
          setFilters(initialFilters);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error de conexión al cargar el catálogo');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [categoriaSlug, subcategoriaSlug, searchParams, terminoBusqueda]); // ← Agregada dependencia

  const recargarProductosOriginales = useCallback(async () => {
    let productos: Producto[] = [];
    const categoriaId = searchParams.get('categoria') || (categoriaActual?.id.toString());
    
    if (categoriaId && categoriaActual) {
      if (!categoriaActual.parent_id) {
        // Es categoría padre - cargar productos según si tiene subcategorías
        if (subcategorias.length > 0) {
          // Cargar productos de todas las subcategorías
          const productosPromises = subcategorias.map(sub => 
            apiManager.productos.obtenerPorCategoria(sub.id)
          );
          const productosResponses = await Promise.all(productosPromises);
          
          for (const prodResponse of productosResponses) {
            if (prodResponse.success && prodResponse.data) {
              productos.push(...(prodResponse.data.productos || []));
            }
          }
        } else {
          // Sin subcategorías, cargar productos directos
          const productosResponse = await apiManager.productos.obtenerPorCategoria(parseInt(categoriaId));
          if (productosResponse.success && productosResponse.data) {
            productos = productosResponse.data.productos || [];
          }
        }
      } else {
        // Es subcategoría
        const productosResponse = await apiManager.productos.obtenerPorCategoria(parseInt(categoriaId));
        if (productosResponse.success && productosResponse.data) {
          productos = productosResponse.data.productos || [];
        }
      }
    }
    
    setProductos(productos);
  }, [searchParams, categoriaActual, subcategorias]);

  // ✅ MODIFICADO: Solo aplicar filtros si NO estamos en modo búsqueda
  useEffect(() => {
    // Si estamos en modo búsqueda, no aplicar filtros
    if (terminoBusqueda) {
      return;
    }

    const applyFilters = async () => {
      console.log('🔧 APLICANDO FILTROS DINÁMICOS');
      setLoadingProductos(true);
      const filtrosActivos = getFiltrosActivos();
      
      // Determinar qué categoría usar para filtrar
      let categoriaParaFiltros: number | undefined;
      
      if (categoriaActual) {
        categoriaParaFiltros = categoriaActual.id;
      }
      
      if (Object.keys(filtrosActivos).length > 0) {
        // 1. Filtrar productos
        const response = await apiManager.atributos.filtrarProductosSimple(
          filtrosActivos, 
          1, 
          50, 
          categoriaParaFiltros
        );
        
        if (response.success && response.data) {
          setProductos(response.data.productos);
        }
        
        // 2. Actualizar filtros dinámicos
        const filtrosDinamicosResponse = await apiManager.atributos.obtenerFiltrosDinamicos(
          categoriaParaFiltros,
          filtrosActivos
        );

        console.log('🔍 Filtros enviados al backend:', filtrosActivos);
        console.log('🔍 Respuesta filtros dinámicos:', filtrosDinamicosResponse.data);
              
        if (filtrosDinamicosResponse.success && filtrosDinamicosResponse.data) {
          const atributosActualizados = filtrosDinamicosResponse.data.filtros;
          
          // Mantener estructura original pero actualizar valores disponibles
          setAtributos(prevAtributos => {
            return prevAtributos.map(atributoOriginal => {
              const atributoActualizado = atributosActualizados.find(
                a => a.id === atributoOriginal.id
              );
              
              if (atributoActualizado) {
                return {
                  ...atributoOriginal,
                  valores: atributoActualizado.valores
                };
              }
              
              // Si no hay valores dinámicos, mantener valores originales
              return atributoOriginal;
            });
          });
        }
            
      } else {
        // Sin filtros - recargar productos originales Y filtros completos
        console.log('🔄 SIN FILTROS - Recargando todo');
        await recargarProductosOriginales();
        
        // Recargar filtros completos (no dinámicos) - SIN TOCAR setFilters
        if (categoriaParaFiltros) {
          console.log('🔄 Recargando filtros completos para categoría:', categoriaParaFiltros);
          const filtrosResponse = await apiManager.atributos.obtenerFiltros(categoriaParaFiltros);
          if (filtrosResponse.success && filtrosResponse.data) {
            const atributosData = filtrosResponse.data.filtros;
            console.log('🔄 Filtros recargados:', atributosData);
            setAtributos(atributosData);
          }
        }
      }    
      setLoadingProductos(false);
    };
    
    if (atributos.length > 0) {
      applyFilters();
    }
  }, [filters, atributos.length, categoriaActual, terminoBusqueda]); // ← Agregada dependencia
  
  // Función para obtener filtros activos
  const getFiltrosActivos = useCallback((): Record<string, string[]> => {
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
  }, [filters]);

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
        <main className="min-h-[91vh] bg-gray-100">
          <div className="max-w-7xl mx-auto py-4">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {terminoBusqueda ? 'Buscando productos...' : 'Cargando catálogo...'}
                </p>
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
          
          {/* ✅ MODIFICADO: Breadcrumb con modo búsqueda */}
          <nav className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </Link>
              <span>&gt;</span>
              <span className="text-gray-700">
                Catálogo
              </span>
              
              {/* Mostrar término de búsqueda si existe */}
              {terminoBusqueda ? (
                <>
                  <span>&gt;</span>
                  <span className="text-gray-900 font-medium">
                    Resultados para: "{terminoBusqueda}"
                  </span>
                </>
              ) : (
                /* Mostrar jerarquía de categorías en modo normal */
                categoriaActual && (
                  <>
                    {/* Si tiene padre, mostrarlo como LINK navegable */}
                    {categoriaActual.parent_id && categoriaActual.padre_nombre && (
                      <>
                        <span>&gt;</span>
                        <Link 
                          to={`/catalogo?categoria=${categoriaActual.parent_id}&nombre=${encodeURIComponent(categoriaActual.padre_nombre)}`}
                          className="hover:text-orange-500 transition-colors"
                        >
                          {categoriaActual.padre_nombre}
                        </Link>
                      </>
                    )}
                    
                    {/* Mostrar la categoría actual como TEXTO (no navegable porque ya estás ahí) */}
                    <span>&gt;</span>
                    <span className="text-gray-900 font-medium">
                      {categoriaActual.nombre}
                    </span>
                  </>
                )
              )}
            </div>
          </nav>

          <div className="flex gap-6">
            
            {/* ✅ MODIFICADO: Sidebar de filtros - Oculto en modo búsqueda */}
            {!terminoBusqueda && (
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  
                  {/* Selector de subcategorías */}
                  {subcategorias.length > 0 && (
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <h3 className="font-bold text-sm text-gray-900 mb-3">Subcategoría</h3>
                      <select
                        value={subcategoriaSeleccionada || ''}
                        onChange={(e) => handleSubcategoriaChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-orange-50"
                      >
                        <option value="">Todas las subcategorías</option>
                        {subcategorias.map((subcategoria) => (
                          <option key={subcategoria.id} value={subcategoria.id}>
                            {subcategoria.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
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
            )}

            {/* Área principal */}
            <div className="flex-1">
              
              {/* Barra de filtros mobile + ordenar */}
              <div className="flex justify-between items-center mb-6">
                
                {/* ✅ MODIFICADO: Botón filtrar - Solo en modo normal */}
                {!terminoBusqueda && (
                  <button
                    onClick={toggleMobileFilters}
                    className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filtrar</span>
                  </button>
                )}

                {/* Información de resultados */}
                <div className="text-sm text-gray-600">
                  {loadingProductos ? 'Filtrando...' : `${productos.length} productos`}
                  {subcategoriaSeleccionada && !terminoBusqueda && (
                    <span className="ml-1 text-orange-600">
                      • {subcategorias.find(s => s.id === subcategoriaSeleccionada)?.nombre}
                    </span>
                  )}
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
                <div className="text-center py-12 px-4">
                  {terminoBusqueda ? (
                    <>
                      <div className="mb-6">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          No encontramos productos para "{terminoBusqueda}"
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Intenta con palabras más generales o revisa la ortografía.
                          <br />
                          También puedes explorar nuestras categorías para encontrar lo que buscas.
                        </p>
                      </div>
                      
                      <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Volver atrás
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-4">
                        No se encontraron productos con los filtros seleccionados.
                      </p>
                      <button
                        onClick={clearFilters}
                        className="text-orange-500 hover:text-orange-700 text-sm underline"
                      >
                        Limpiar filtros
                      </button>
                    </>
                  )}
                </div>
              ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
                      {productos.map((producto) => (
                        <ProductCard
                          key={producto.id}
                          id={producto.id}
                          image={producto.imagen_url || `https://picsum.photos/300/200?random=${producto.id}`}
                          title={producto.nombre}
                          description={producto.descripcion || ''}
                          price={formatearPrecio(producto.precio)}
                          stock={producto.stock}
                        />
                      ))}
                    </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ MODIFICADO: Modal de filtros mobile - Solo en modo normal */}
        {!terminoBusqueda && showMobileFilters && (
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
              
              {/* Selector de subcategorías en mobile */}
              {subcategorias.length > 0 && (
                <div className="mb-6 pb-4 border-b">
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Subcategoría</h4>
                  <select
                    value={subcategoriaSeleccionada || ''}
                    onChange={(e) => handleSubcategoriaChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-orange-50"
                  >
                    <option value="">Todas las subcategorías</option>
                    {subcategorias.map((subcategoria) => (
                      <option key={subcategoria.id} value={subcategoria.id}>
                        {subcategoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
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