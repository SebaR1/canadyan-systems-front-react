import React, { useState, useEffect } from 'react';

interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  parent_id: number | null;
  children?: Categoria[];
}

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; parent_id?: number }) => Promise<void>;
  editing?: Categoria | null;
  categorias: Categoria[]; // Para el selector de padre
}

const CategoriaModal: React.FC<CategoriaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editing,
  categorias
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    parent_id: '' as string
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Llenar formulario cuando se edita
  useEffect(() => {
    if (editing) {
      setFormData({
        nombre: editing.nombre,
        parent_id: editing.parent_id?.toString() || ''
      });
    } else {
      setFormData({
        nombre: '',
        parent_id: ''
      });
    }
    setErrors({});
  }, [editing, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Si se selecciona padre, verificar que no sea la misma categoría que se está editando
    if (editing && formData.parent_id && parseInt(formData.parent_id) === editing.id) {
      newErrors.parent_id = 'Una categoría no puede ser padre de sí misma';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData: { nombre: string; parent_id?: number } = {
        nombre: formData.nombre.trim()
      };

      // Solo incluir parent_id si se seleccionó uno
      if (formData.parent_id) {
        submitData.parent_id = parseInt(formData.parent_id);
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error en modal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función recursiva para obtener todas las categorías (aplana el árbol)
  const getFlatCategorias = (cats: Categoria[], prefix: string = ''): Array<{id: number, nombre: string, level: number}> => {
    let result: Array<{id: number, nombre: string, level: number}> = [];
    
    cats.forEach(cat => {
      result.push({
        id: cat.id,
        nombre: prefix + cat.nombre,
        level: prefix.length / 2 // Calcular nivel por la indentación
      });
      
      if (cat.children && cat.children.length > 0) {
        result = result.concat(getFlatCategorias(cat.children, prefix + '  '));
      }
    });
    
    return result;
  };

  if (!isOpen) return null;

  const flatCategorias = getFlatCategorias(categorias);
  // Filtrar la categoría que se está editando para evitar bucles
  const availableParents = editing 
    ? flatCategorias.filter(cat => cat.id !== editing.id)
    : flatCategorias;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editing ? 'Editar Categoría' : 'Nueva Categoría'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la categoría *
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Electrónicos, Routers, etc."
                disabled={loading}
                autoFocus
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Categoría padre */}
            <div>
              <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría padre (opcional)
              </label>
              <select
                id="parent_id"
                value={formData.parent_id}
                onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.parent_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">-- Sin categoría padre (nivel raíz) --</option>
                {availableParents.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              {errors.parent_id && (
                <p className="mt-1 text-sm text-red-600">{errors.parent_id}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Las categorías padre se muestran con indentación para mostrar la jerarquía
              </p>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-3 pt-4">
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  editing ? 'Actualizar' : 'Crear Categoría'
                )}
              </button>
            </div>
          </form>

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700">
                <p><strong>Consejos:</strong></p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>El slug se generará automáticamente del nombre</li>
                  <li>Las subcategorías heredan productos de su padre</li>
                  <li>Máximo 2 niveles de profundidad recomendado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriaModal;