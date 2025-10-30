import React, { useState, useEffect } from 'react';

interface Atributo {
  id: number;
  nombre: string;
  tipo: 'text' | 'select' | 'number' | 'boolean';
  created_at: string;
}

interface AtributoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; tipo: string }) => Promise<void>;
  editing?: Atributo | null;
}

const AtributoModal: React.FC<AtributoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editing
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'text' as string
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Llenar formulario cuando se edita
  useEffect(() => {
    if (editing) {
      setFormData({
        nombre: editing.nombre,
        tipo: editing.tipo
      });
    } else {
      setFormData({
        nombre: '',
        tipo: 'text'
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

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo es requerido';
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
      const submitData = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error en modal:', error);
    } finally {
      setLoading(false);
    }
  };

  const tiposAtributo = [
    { value: 'text', label: 'Texto', description: 'Campo de texto libre' },
    { value: 'select', label: 'Selección', description: 'Lista de opciones predefinidas (valores separados por coma)' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editing ? 'Editar Atributo' : 'Nuevo Atributo'}
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
                Nombre del atributo *
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Velocidad, Color, Garantía"
                disabled={loading}
                autoFocus
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Nombre que aparecerá en los formularios de producto
              </p>
            </div>

            {/* Tipo de atributo */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de dato *
              </label>
              <div className="space-y-2">
                {tiposAtributo.map((tipo) => (
                  <label key={tipo.value} className="flex items-start">
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo.value}
                      checked={formData.tipo === tipo.value}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                      className="mt-1 mr-3 text-green-600 focus:ring-green-500 border-gray-300"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{tipo.label}</div>
                      <div className="text-sm text-gray-500">{tipo.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  editing ? 'Actualizar' : 'Crear Atributo'
                )}
              </button>
            </div>
          </form>

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-700">
                <p><strong>Tipos de atributo:</strong></p>
                <ul className="mt-1 space-y-1">
                  <li><strong>Texto:</strong> Para valores como "Rojo", "Mediano", etc.</li>
                  <li><strong>Selección:</strong> Para opciones fijas como "S/M/L"</li>
                  <li><strong>Número:</strong> Para valores como "100", "2.5", etc.</li>
                  <li><strong>Sí/No:</strong> Para características como "Resistente al agua"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtributoModal;