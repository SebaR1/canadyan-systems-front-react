import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Producto, Categoria, Atributo, ProductoAtributo } from '../../services/types';
import ImageUploadManager, { ImageUploadManagerRef } from '../../components/ImageUploadManager/ImageUploadManager';
import FileUploadManager, { FileUploadManagerRef } from '../../components/FileUploadManager/FileUploadManager';
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
  const [hasPendingImages, setHasPendingImages] = useState(false);

  const imageUploadRef = useRef<ImageUploadManagerRef>(null);
  const fileUploadRef = useRef<FileUploadManagerRef>(null);
  const [hasPendingFiles, setHasPendingFiles] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'imagenes' | 'archivos'>('info');
  const [mountedTabs, setMountedTabs] = useState<Record<string, boolean>>({ info: true });
  const wasOpenRef = useRef(false);

  // Auto-cerrar notificaciones después de 5 segundos
  useEffect(() => {
    if (errorNotification) {
      const timer = setTimeout(() => setErrorNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorNotification]);

  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => setSuccessNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  const handleTabChange = (tab: 'info' | 'imagenes' | 'archivos') => {
    setActiveTab(tab);
    if (!mountedTabs[tab]) {
      setMountedTabs(prev => ({ ...prev, [tab]: true }));
    }
  };

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Solo resetear pestaña cuando el modal se abre por primera vez, no al actualizar editing
      if (!wasOpenRef.current) {
        setActiveTab('info');
        loadCategorias();
        loadAtributos();
      }
      wasOpenRef.current = true;

      if (editing) {
        loadProductoAtributos(editing.id);
        loadImagenes(editing.id);
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
    } else {
      wasOpenRef.current = false;
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

  // ← NUEVA FUNCIÓN: Aplanar categorías con indentación notoria
  const flattenCategorias = (cats: Categoria[], level: number = 0): Array<{id: number, nombre: string, displayName: string, isAbuelo: boolean, level: number}> => {
    let result: Array<{id: number, nombre: string, displayName: string, isAbuelo: boolean, level: number}> = [];

    cats.forEach(cat => {
      const isAbuelo = level === 0; // Nivel 0 = Abuelo (NO seleccionable)
      const isPadre = level === 1;  // Nivel 1 = Padre
      const isHijo = level === 2;   // Nivel 2 = Hijo

      // Indentación notoria con guiones medios
      let displayName = '';

      if (isAbuelo) {
        // Abuelo: Mayúsculas, sin indentación
        displayName = `${cat.nombre.toUpperCase()}`;
      } else if (isPadre) {
        // Padre: Indentación visible con guiones
        displayName = `---- ${cat.nombre}`;
      } else if (isHijo) {
        // Hijo: Mayor indentación con más guiones
        displayName = `-------- ${cat.nombre}`;
      }

      result.push({
        id: cat.id,
        nombre: cat.nombre,
        displayName: displayName,
        isAbuelo: isAbuelo,
        level: level
      });

      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategorias(cat.children, level + 1));
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

      // 1. Primero subir imágenes pendientes si las hay
      if (hasPendingImages && imageUploadRef.current && editing?.id) {
        try {
          await imageUploadRef.current.uploadPendingImages();
        } catch (error) {
          console.error('Error al subir imágenes:', error);
          setErrorNotification('Error al subir las imágenes. Por favor intenta nuevamente.');
          return;
        }
      }

      // 2. Subir archivos pendientes si los hay
      if (hasPendingFiles && fileUploadRef.current && editing?.id) {
        try {
          await fileUploadRef.current.uploadPendingFiles();
        } catch (error: any) {
          console.error('Error al subir archivos:', error);
          setErrorNotification(error.message || 'Error al subir archivos');
          return;
        }
      }

      // 3. Luego actualizar el producto
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

      // Mostrar notificación de éxito al editar
      if (editing) {
        setSuccessNotification('Producto actualizado correctamente');
      }
    } catch (error: any) {
      console.error('Error en modal:', error);
      setErrorNotification(error.message || 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const flatCategorias = flattenCategorias(categorias);
  
  // ← NUEVO: Filtrar atributos disponibles (que no están seleccionados)
  const atributosDisponibles = atributos.filter(attr => !atributosSeleccionados.includes(attr.id));

  return (
    <>
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

            {/* Pestañas - solo cuando editamos producto existente */}
            {editing && editing.id && (
              <div className="flex space-x-1 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => handleTabChange('info')}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'info'
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Información Básica
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('imagenes')}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'imagenes'
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Imágenes del Producto
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('archivos')}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'archivos'
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Archivos y Documentos
                </button>
              </div>
            )}

            {/* Contenido pestaña: Información Básica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={editing && editing.id && activeTab !== 'info' ? { display: 'none' } : undefined}>
              
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
                    rows={6}
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

                {/* Categoría - Ancho completo */}
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
                    {flatCategorias.map(cat => {
                      // Clases CSS según nivel para mejor visualización
                      let optionClass = '';
                      if (cat.isAbuelo) {
                        optionClass = 'font-bold text-gray-600 bg-gray-100';
                      } else if (cat.level === 1) {
                        optionClass = 'font-medium text-gray-800';
                      } else if (cat.level === 2) {
                        optionClass = 'text-gray-700';
                      }

                      return (
                        <option
                          key={cat.id}
                          value={cat.isAbuelo ? "" : cat.id}
                          disabled={cat.isAbuelo}
                          className={optionClass}
                          style={{
                            fontWeight: cat.isAbuelo ? 'bold' : cat.level === 1 ? '600' : 'normal',
                            color: cat.isAbuelo ? '#9ca3af' : cat.level === 1 ? '#1f2937' : '#4b5563'
                          }}
                        >
                          {cat.displayName}
                        </option>
                      );
                    })}
                  </select>
                  {errors.categoria_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
                  )}
                </div>

                {/* SKU y Estado activo */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <label className="flex items-center h-10 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                        className="mr-2 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">Producto activo</span>
                    </label>
                  </div>
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

            {/* Pestaña: Imágenes del Producto - lazy mount */}
            {editing && editing.id && mountedTabs.imagenes && (
              <div className="pt-2" style={{ display: activeTab === 'imagenes' ? 'block' : 'none' }}>
                <ImageUploadManager
                  ref={imageUploadRef}
                  productoId={editing.id}
                  imagenes={imagenes}
                  onImagenesChange={setImagenes}
                  onUpload={handleUploadImagenes}
                  onDelete={handleDeleteImagen}
                  onSetPrincipal={handleSetPrincipal}
                  maxImagenes={10}
                  disabled={loading || loadingImagenes}
                  onPreviewsChange={(hasPreviews, validFiles) => {
                    setHasPendingImages(hasPreviews);
                  }}
                />
              </div>
            )}

            {/* Pestaña: Archivos y Documentos - lazy mount */}
            {editing && editing.id && mountedTabs.archivos && (
              <div className="pt-2" style={{ display: activeTab === 'archivos' ? 'block' : 'none' }}>
                <FileUploadManager
                  ref={fileUploadRef}
                  productoId={editing.id}
                  onPendingFilesChange={setHasPendingFiles}
                  onError={setErrorNotification}
                />
              </div>
            )}

            {/* Aviso para producto nuevo */}
            {(!editing || !editing.id) && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 pt-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Las imágenes y archivos se pueden agregar después de crear el producto</span>
              </div>
            )}

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

      {/* Notificación de éxito - portal para evitar stacking context del modal */}
      {successNotification && createPortal(
        <div className="fixed top-20 right-4 z-[60] animate-slide-in">
          <div className="bg-white border-l-4 border-green-500 px-6 py-4 rounded-lg shadow-2xl max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Éxito</h3>
                <p className="mt-1 text-sm text-gray-600">{successNotification}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotification(null)}
                className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Notificación de error - portal para evitar stacking context del modal */}
      {errorNotification && createPortal(
        <div className="fixed top-20 right-4 z-[60] animate-slide-in">
          <div className="bg-white border-l-4 border-red-500 px-6 py-4 rounded-lg shadow-2xl max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Error</h3>
                <p className="mt-1 text-sm text-gray-600">{errorNotification}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorNotification(null)}
                className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ProductoModal;