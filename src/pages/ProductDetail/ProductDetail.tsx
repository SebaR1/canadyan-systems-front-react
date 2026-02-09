import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import NoImagePlaceholder from '../../components/NoImagePlaceholder';
import apiManager from '../../services/ApiIndex';
import { Producto, ProductoArchivo } from '../../services/types';

interface CategoriaInfo {
  id: number;
  nombre: string;
  parent_id?: number | null;
  padre_nombre?: string;
  padre_id?: number | null;
  abuelo_nombre?: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [categoriaInfo, setCategoriaInfo] = useState<CategoriaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'caracteristicas' | 'descargas' | 'videos'>('caracteristicas');

  // Estados para las imágenes
  const [imagenes, setImagenes] = useState<any[]>([]);
  const [imagenActual, setImagenActual] = useState(0);
  const [loadingImagenes, setLoadingImagenes] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Estados para archivos descargables
  const [archivos, setArchivos] = useState<ProductoArchivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);

  // Estado de favorito
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    if (!id || !Number.isInteger(Number(id))) {
      setError('ID de producto inválido');
      setLoading(false);
      return;
    }

    cargarProducto();
  }, [id]);

  // Cuando cargamos las imágenes, transformar las URLs
  const cargarImagenes = async (productoId: number) => {
    try {
      setLoadingImagenes(true);
      const response = await apiManager.productoImagenes.listarImagenes(productoId);
      
      if (response.success && response.data) {
        const imgs = response.data.imagenes || [];
        
        // ✅ AGREGAR: Transformar URLs para que sean absolutas
        const imagenesConUrlCompleta = imgs.map((img: any) => ({
          ...img,
          url: `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/${img.url}`
        }));
        
        setImagenes(imagenesConUrlCompleta);
        setImagenActual(0);
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      setImagenes([]);
    } finally {
      setLoadingImagenes(false);
    }
  };

  const cargarArchivos = async (productoId: number) => {
    try {
      setLoadingArchivos(true);
      const response = await apiManager.productoArchivos.listarArchivos(productoId);
      if (response.success && response.data) {
        setArchivos(response.data);
      }
    } catch (error) {
      console.error('Error cargando archivos:', error);
      setArchivos([]);
    } finally {
      setLoadingArchivos(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const cargarProducto = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiManager.productos.obtenerPorId(Number(id));
      
      if (response.success && response.data) {
        setProducto((response.data as any).producto);

        if ((response.data as any).producto.id) {
          await cargarImagenes((response.data as any).producto.id);
          await cargarArchivos((response.data as any).producto.id);

          // Verificar si es favorito (solo si hay usuario logueado)
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const checkRes = await apiManager.favoritos.verificar((response.data as any).producto.id);
              if (checkRes.success && checkRes.data) {
                setIsFavorito(checkRes.data.es_favorito);
              }
            } catch (e) {
              // No bloquear la carga del producto si falla esta verificación
            }
          }
        }

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
        let padre_id = undefined;
        let abuelo_nombre = undefined;

        if (categoria.parent_id) {
          const padreResponse = await apiManager.categorias.obtenerPorId(categoria.parent_id);
          if (padreResponse.success && padreResponse.data) {
            const padre = padreResponse.data.categoria;
            padre_nombre = padre.nombre;
            padre_id = padre.id;

            // Si el padre tiene padre (abuelo), cargarlo también
            if (padre.parent_id) {
              const abueloResponse = await apiManager.categorias.obtenerPorId(padre.parent_id);
              if (abueloResponse.success && abueloResponse.data) {
                abuelo_nombre = abueloResponse.data.categoria.nombre;
              }
            }
          }
        }

        setCategoriaInfo({
          id: categoria.id,
          nombre: categoria.nombre,
          parent_id: categoria.parent_id,
          padre_nombre: padre_nombre,
          padre_id: padre_id,
          abuelo_nombre: abuelo_nombre
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

  const handleToggleFavorito = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
      return;
    }

    try {
      if (isFavorito) {
        await apiManager.favoritos.eliminar(Number(id));
      } else {
        await apiManager.favoritos.agregar(Number(id));
      }
      setIsFavorito(!isFavorito);
    } catch (e) {
      console.error('Error al togglear favorito:', e);
    }
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
          <nav className="mb-6 overflow-x-auto">
            <div className="flex items-center space-x-2 text-sm text-gray-600 flex-nowrap min-w-max">
              <Link to="/" className="hover:text-orange-500 transition-colors whitespace-nowrap">
                Inicio
              </Link>
              <span className="flex-shrink-0">&gt;</span>
              <span className="whitespace-nowrap">Catálogo</span>

              {categoriaInfo && (
                <>
                  {/* Abuelo (si existe) - NO clickeable */}
                  {categoriaInfo.abuelo_nombre && (
                    <>
                      <span className="flex-shrink-0">&gt;</span>
                      <span className="whitespace-nowrap">{categoriaInfo.abuelo_nombre}</span>
                    </>
                  )}

                  {/* Padre (si existe) - Determinar si es Abuelo o Padre real */}
                  {categoriaInfo.parent_id && categoriaInfo.padre_nombre && (
                    <>
                      <span className="flex-shrink-0">&gt;</span>
                      {/* Si NO hay abuelo, el "padre" es realmente el ABUELO → NO clickeable */}
                      {!categoriaInfo.abuelo_nombre ? (
                        <span className="whitespace-nowrap">{categoriaInfo.padre_nombre}</span>
                      ) : (
                        /* Si SÍ hay abuelo, entonces este es realmente el PADRE → Clickeable */
                        <Link
                          to={`/catalogo?categoria=${categoriaInfo.padre_id}&nombre=${encodeURIComponent(categoriaInfo.padre_nombre)}`}
                          className="hover:text-orange-500 transition-colors whitespace-nowrap"
                        >
                          {categoriaInfo.padre_nombre}
                        </Link>
                      )}
                    </>
                  )}

                  {/* Categoría actual - Clickeable */}
                  <span className="flex-shrink-0">&gt;</span>
                  <Link
                    to={`/catalogo?categoria=${categoriaInfo.id}&nombre=${encodeURIComponent(categoriaInfo.nombre)}`}
                    className="hover:text-orange-500 transition-colors whitespace-nowrap"
                  >
                    {categoriaInfo.nombre}
                  </Link>
                </>
              )}

              {/* Producto actual - NO clickeable */}
              <span className="flex-shrink-0">&gt;</span>
              <span className="text-gray-900 font-medium whitespace-nowrap">
                {producto.nombre}
              </span>
            </div>
          </nav>

          {/* Contenido principal */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
          {/* Imagen del producto - MODIFICADO CON PLACEHOLDER */}
          <div className="flex flex-col justify-center w-full">
            {/* Imagen Principal o Placeholder */}
            <div className="w-full">
              {loadingImagenes ? (
                <div className="bg-gray-50 rounded-2xl border-2 border-gray-300 p-6 flex items-center justify-center min-h-80">
                  <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
              ) : imagenes.length === 0 ? (
                <NoImagePlaceholder />
              ) : (
                <div className="bg-gray-50 rounded-2xl border-2 border-gray-300 p-6 flex items-center justify-center min-h-80 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowImageModal(true)}>
                  <img
                    src={imagenes[imagenActual]?.url}
                    alt={producto.nombre}
                    className="max-w-full max-h-full object-contain hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
            </div>

            {/* Galería de Thumbnails - Solo si hay más de 1 imagen */}
            {imagenes.length > 1 && (
              <div className="mt-4 w-full">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {imagenes.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setImagenActual(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                        index === imagenActual
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${producto.nombre} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
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

                {/* Botones: Comprar + Favorito */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleComprar}
                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-200 text-lg"
                  >
                    COMPRAR
                  </button>

                  <button
                    onClick={handleToggleFavorito}
                    className="p-3 rounded-full border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 active:bg-orange-100 transition-colors"
                    aria-label={isFavorito ? 'Remover de favoritos' : 'Agregar a favoritos'}
                  >
                    <svg
                      className={`w-6 h-6 transition-colors ${isFavorito ? 'text-orange-500' : 'text-gray-400'}`}
                      fill={isFavorito ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={isFavorito ? 0 : 1.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.716-1.607-2.377-2.733-4.313-2.733C5.648 3.75 3.5 5.765 3.5 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sección Descripción */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                DESCRIPCIÓN
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {producto.descripcion}
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex space-x-0 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('caracteristicas')}
                  className={`px-4 sm:px-6 py-3 font-semibold rounded-l-full transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'caracteristicas'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Características
                </button>
                <button
                  onClick={() => setActiveTab('descargas')}
                  className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'descargas'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Centro de descargas
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-4 sm:px-6 py-3 font-semibold rounded-r-full transition-colors whitespace-nowrap flex-shrink-0 ${
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
                          <div key={atributo.atributo_id || index} className="flex flex-wrap gap-1">
                            <span className="font-medium text-gray-700 min-w-fit">{atributo.atributo_nombre}:</span>
                            <span className="text-gray-600 break-words">{atributo.valor}</span>
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
                    {loadingArchivos ? (
                      <div className="text-center py-8 text-gray-500">Cargando archivos...</div>
                    ) : archivos.length > 0 ? (
                      <div className="space-y-3">
                        {archivos.map((archivo) => (
                          <div
                            key={archivo.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              {/* Ícono según tipo de archivo */}
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
                                {archivo.tipo_archivo === 'pdf' && (
                                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                                  </svg>
                                )}
                                {['doc', 'docx'].includes(archivo.tipo_archivo) && (
                                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8zm0-3h4v2H8z"/>
                                  </svg>
                                )}
                                {['xls', 'xlsx'].includes(archivo.tipo_archivo) && (
                                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2zM8 17h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2z"/>
                                  </svg>
                                )}
                                {['jpg', 'jpeg', 'png', 'gif'].includes(archivo.tipo_archivo) && (
                                  <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                  </svg>
                                )}
                                {!['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'].includes(archivo.tipo_archivo) && (
                                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                                  </svg>
                                )}
                              </div>

                              {/* Información del archivo */}
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {archivo.nombre_personalizado || archivo.nombre_original}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {archivo.tipo_archivo.toUpperCase()} · {formatBytes(archivo.tamanio_bytes)}
                                </p>
                              </div>
                            </div>

                            {/* Botón de descarga */}
                            <button
                              onClick={() => apiManager.productoArchivos.descargarArchivo(archivo.id, archivo.nombre_personalizado ? `${archivo.nombre_personalizado}.${archivo.tipo_archivo}` : archivo.nombre_original)}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 text-sm font-medium flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>Descargar</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <svg className="w-14 h-14 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">No hay archivos disponibles para este producto</p>
                      </div>
                    )}
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

      {/* Modal de imagen ampliada */}
      {showImageModal && imagenes.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-bold z-10"
            aria-label="Cerrar"
          >
            ×
          </button>
          <img
            src={imagenes[imagenActual]?.url}
            alt={producto?.nombre || 'Producto'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ProductDetail;