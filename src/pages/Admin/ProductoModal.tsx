import React, { useState, useEffect } from 'react';
import { Producto, Categoria, Atributo, ProductoAtributo } from '../../services/types';
import ImageUploadManager from '../../components/ImageUploadManager/ImageUploadManager';
import { ProductoImagen } from '../../services/modules/ProductoImagenService';
import apiManager from '../../services/ApiIndex';


interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productoData: any) => Promise<void>;
  editing?: Producto | null;
}

interface FormData {
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  sku: string;
  categoria_id: string;
  activo: boolean;
}

interface AtributoValue {
  atributo_id: number;
  valor: string;
}

const ProductoModal: React.FC<ProductoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editing = null
}) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '0',
    sku: '',
    categoria_id: '',
    activo: true
  });

  const [atributosValues, setAtributosValues] = useState<AtributoValue[]>([]);
  const [atributosSeleccionados, setAtributosSeleccionados] = useState<number[]>([]); // ← NUEVO
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [productoAtributos, setProductoAtributos] = useState<ProductoAtributo[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingAtributos, setLoadingAtributos] = useState(false);
  const [loadingProductoAtributos, setLoadingProductoAtributos] = useState(false);
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [imagenes, setImagenes] = useState<ProductoImagen[]>([]);
  const [loadingImagenes, setLoadingImagenes] = useState(false);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCategorias();
      loadAtributos();
      
      if (editing) {
        loadProductoAtributos(editing.id);
        loadImagenes(editing.id);  // ← AGREGAR ESTA LÍNEA
        setFormData({
          nombre: editing.nombre || '',
          descripcion: editing.descripcion || '',
          precio: editing.precio?.toString() || '',
          stock: editing.stock?.toString() || '0',
          sku: editing.sku || '',
          categoria_id: editing.categoria_id?.toString() || '',
          activo: editing.activo ?? true
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editing]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '0',
      sku: '',
      categoria_id: '',
      activo: true
    });
    setAtributosValues([]);
    setAtributosSeleccionados([]);
    setProductoAtributos([]);
    setImagenes([]);  // ← AGREGAR ESTA LÍNEA
    setErrors({});
  };

  // Cargar categorías (árbol jerárquico)
  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/categorias.php?action=tree`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCategorias(result.data?.tree || result.tree || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const loadAtributos = async () => {
    try {
      setLoadingAtributos(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/atributos.php?action=list`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.atributos) {
        setAtributos(result.data.atributos);
      }
    } catch (error) {
      console.error('Error cargando atributos:', error);
    } finally {
      setLoadingAtributos(false);
    }
  };

  const loadProductoAtributos = async (productoId: number) => {
    try {
      setLoadingProductoAtributos(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/routes/atributos.php?action=by-product&producto_id=${productoId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const attrs = result.data.atributos || [];
        setProductoAtributos(attrs);
        
        const attrValues: AtributoValue[] = attrs.map((attr: ProductoAtributo) => ({
          atributo_id: attr.atributo_id,
          valor: attr.valor
        }));
        setAtributosValues(attrValues);
        
        // ← NUEVO: Marcar como seleccionados los atributos que ya tiene el producto
        const attrIds = attrs.map((attr: ProductoAtributo) => attr.atributo_id);
        setAtributosSeleccionados(attrIds);
      }
    } catch (error) {
      console.error('Error cargando atributos del producto:', error);
    } finally {
      setLoadingProductoAtributos(false);
    }
  };

  // Cargar imágenes del producto
  const loadImagenes = async (productoId: number) => {
    try {
      setLoadingImagenes(true);
      const response = await apiManager.productoImagenes.listarImagenes(productoId);
      
      if (response.success && response.data) {
        setImagenes(response.data.imagenes || []);
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error);
    } finally {
      setLoadingImagenes(false);
    }
  };

  // Subir imágenes
  const handleUploadImagenes = async (archivos: File[]) => {
    if (!editing || !editing.id) {
      alert('Guarda primero el producto antes de subir imágenes');
      return;
    }

    try {
      const response = await apiManager.productoImagenes.subirImagenes(
        editing.id,
        archivos,
        imagenes.length === 0 ? 'principal' : 'galeria'
      );

      if (response.success && response.data) {
        await loadImagenes(editing.id);
        
        if (response.data.errores && response.data.errores.length > 0) {
          alert(`Algunas imágenes tuvieron errores:\n${response.data.errores.join('\n')}`);
        }
      } else {
        alert('Error al subir imágenes');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir imágenes');
    }
  };

  // Eliminar imagen
  const handleDeleteImagen = async (imagenId: number) => {
    if (!editing || !editing.id) return;

    try {
      const response = await apiManager.productoImagenes.eliminarImagen(imagenId);
      
      if (response.success) {
        await loadImagenes(editing.id);
      } else {
        alert('Error al eliminar imagen');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar imagen');
    }
  };

  // Cambiar imagen principal
  const handleSetPrincipal = async (imagenId: number) => {
    if (!editing || !editing.id) return;

    try {
      const response = await apiManager.productoImagenes.cambiarPrincipal(imagenId);
      
      if (response.success) {
        await loadImagenes(editing.id);
      } else {
        alert('Error al cambiar imagen principal');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar imagen principal');
    }
  };

  // ← NUEVA FUNCIÓN: Aplanar categorías con indicador visual de jerarquía
  const flattenCategorias = (cats: Categoria[], prefix: string = ''): Array<{id: number, nombre: string, displayName: string}> => {
    let result: Array<{id: number, nombre: string, displayName: string}> = [];
    
    cats.forEach(cat => {
      const displayName = prefix ? `${prefix} → ${cat.nombre}` : cat.nombre;
      
      result.push({
        id: cat.id,
        nombre: cat.nombre,
        displayName: displayName
      });
      
      if (cat.children && cat.children.length > 0) {
        const newPrefix = prefix ? `${prefix} → ${cat.nombre}` : cat.nombre;
        result = result.concat(flattenCategorias(cat.children, newPrefix));
      }
    });
    
    return result;
  };

  // ← NUEVA FUNCIÓN: Agregar atributo a la lista
  const handleAgregarAtributo = (atributoId: string) => {
    const id = parseInt(atributoId);
    if (id && !atributosSeleccionados.includes(id)) {
      setAtributosSeleccionados([...atributosSeleccionados, id]);
    }
  };

  // ← NUEVA FUNCIÓN: Quitar atributo de la lista
  const handleQuitarAtributo = (atributoId: number) => {
    setAtributosSeleccionados(atributosSeleccionados.filter(id => id !== atributoId));
    setAtributosValues(atributosValues.filter(attr => attr.atributo_id !== atributoId));
  };

  // Manejar cambios en atributos
  const handleAtributoChange = (atributoId: number, valor: string) => {
    setAtributosValues(prev => {
      const existing = prev.find(a => a.atributo_id === atributoId);
      if (existing) {
        return prev.map(a => a.atributo_id === atributoId ? { ...a, valor } : a);
      } else {
        return [...prev, { atributo_id: atributoId, valor }];
      }
    });
  };

  // Obtener valor de atributo
  const getAtributoValue = (atributoId: number): string => {
    const attr = atributosValues.find(a => a.atributo_id === atributoId);
    return attr?.valor || '';
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido';
    } else if (isNaN(parseFloat(formData.precio)) || parseFloat(formData.precio) < 0) {
      newErrors.precio = 'El precio debe ser un número válido mayor o igual a 0';
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'El stock es requerido';
    } else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser un número entero mayor o igual a 0';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Debe seleccionar una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const productoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || null,
        categoria_id: parseInt(formData.categoria_id),
        activo: formData.activo
      };

      const atributos = atributosValues.filter(attr => attr.valor.trim() !== '');

      await onSubmit({
        producto: productoData,
        atributos
      });
    } catch (error) {
      console.error('Error en modal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const flatCategorias = flattenCategorias(categorias);
  
  // ← NUEVO: Filtrar atributos disponibles (que no están seleccionados)
  const atributosDisponibles = atributos.filter(attr => !atributosSeleccionados.includes(attr.id));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Columna izquierda - Datos básicos */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Información Básica</h4>
                
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Router WiFi 6"
                    disabled={loading}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.descripcion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Descripción detallada del producto"
                    disabled={loading}
                  />
                  {errors.descripcion && (
                    <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
                  )}
                </div>

                {/* Precio y Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (ARS) *
                    </label>
                    <input
                      type="number"
                      id="precio"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({...formData, precio: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.precio ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {errors.precio && (
                      <p className="mt-1 text-sm text-red-600">{errors.precio}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      id="stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.stock ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      disabled={loading}
                    />
                    {errors.stock && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                    )}
                  </div>
                </div>

                {/* SKU y Categoría */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                      SKU (Código)
                    </label>
                    <input
                      type="text"
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Opcional"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      id="categoria_id"
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.categoria_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={loading || loadingCategorias}
                    >
                      <option value="">Seleccionar categoría...</option>
                      {flatCategorias.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.displayName}
                        </option>
                      ))}
                    </select>
                    {errors.categoria_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
                    )}
                  </div>
                </div>

                {/* Estado activo */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                      className="mr-2 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-gray-700">Producto activo</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Los productos inactivos no se muestran en el catálogo público
                  </p>
                </div>
              </div>

              {/* Columna derecha - Atributos */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Atributos del Producto</h4>
                
                {loadingAtributos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Cargando atributos...</span>
                  </div>
                ) : atributos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay atributos disponibles</p>
                    <p className="text-xs">Puede crear atributos en la sección de Gestión</p>
                  </div>
                ) : (
                  <>
                    {/* Selector para agregar atributos */}
                    {atributosDisponibles.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Agregar atributo
                        </label>
                        <select
                          value=""
                          onChange={(e) => handleAgregarAtributo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          disabled={loading}
                        >
                          <option value="">Seleccionar atributo...</option>
                          {atributosDisponibles.map(attr => (
                            <option key={attr.id} value={attr.id}>
                              {attr.nombre} ({attr.tipo === 'select' ? 'Selección' : 'Texto'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Lista de atributos seleccionados */}
                    {atributosSeleccionados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No hay atributos agregados</p>
                        <p className="text-xs">Seleccione un atributo del menú superior para agregarlo</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {atributosSeleccionados.map(atributoId => {
                          const atributo = atributos.find(a => a.id === atributoId);
                          if (!atributo) return null;

                          return (
                            <div key={atributo.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {atributo.nombre}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleQuitarAtributo(atributo.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  disabled={loading}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              
                              {atributo.tipo === 'select' && atributo.valores && atributo.valores.length > 0 ? (
                                <select
                                  value={getAtributoValue(atributo.id)}
                                  onChange={(e) => handleAtributoChange(atributo.id, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  disabled={loading}
                                >
                                  <option value="">Seleccionar...</option>
                                  {atributo.valores.map((valor, idx) => (
                                    <option key={idx} value={valor}>
                                      {valor}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={getAtributoValue(atributo.id)}
                                  onChange={(e) => handleAtributoChange(atributo.id, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  placeholder="Valor del atributo"
                                  disabled={loading}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sección de Imágenes */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Imágenes del Producto</h4>
              
              {editing && editing.id ? (
                <ImageUploadManager
                  productoId={editing.id}
                  imagenes={imagenes}
                  onImagenesChange={setImagenes}
                  onUpload={handleUploadImagenes}
                  onDelete={handleDeleteImagen}
                  onSetPrincipal={handleSetPrincipal}
                  maxImagenes={10}
                  disabled={loading || loadingImagenes}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                  <p className="font-medium mb-1">⚠️ Guarda el producto primero</p>
                  <p>Las imágenes se pueden agregar después de crear el producto</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {editing ? 'Actualizando...' : 'Creando...'}
                  </div>
                ) : (
                  editing ? 'Actualizar Producto' : 'Crear Producto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductoModal;