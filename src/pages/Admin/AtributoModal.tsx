import React, { useState, useEffect } from 'react';

interface Atributo {
  id: number;
  nombre: string;
  tipo: 'text' | 'select' | 'number' | 'boolean';
  valores?: string[];
  created_at: string;
}

interface AtributoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; tipo: string; valores?: string[] }) => Promise<void>;
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
    tipo: 'text' as string,
    valores: [] as string[]
  });
  const [valoresInput, setValoresInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Llenar formulario cuando se edita
  useEffect(() => {
    if (editing) {
      setFormData({
        nombre: editing.nombre,
        tipo: editing.tipo,
        valores: editing.valores || []
      });
      setValoresInput(editing.valores ? editing.valores.join(', ') : '');
    } else {
      setFormData({
        nombre: '',
        tipo: 'text',
        valores: []
      });
      setValoresInput('');
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

    // Validar valores si es tipo 'select'
    if (formData.tipo === 'select') {
      if (!valoresInput.trim()) {
        newErrors.valores = 'Debe ingresar al menos un valor para el atributo tipo selección';
      } else {
        const valoresArray = valoresInput.split(',').map(v => v.trim()).filter(v => v !== '');
        if (valoresArray.length === 0) {
          newErrors.valores = 'Debe ingresar al menos un valor válido';
        }
      }
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
      const submitData: { nombre: string; tipo: string; valores?: string[] } = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo
      };

      // Si es tipo 'select', procesar los valores
      if (formData.tipo === 'select') {
        const valoresArray = valoresInput
          .split(',')
          .map(v => v.trim())
          .filter(v => v !== '');
        submitData.valores = valoresArray;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error en modal:', error);
    } finally {
      setLoading(false);
    }
  };

  const tiposAtributo = [
    { value: 'text', label: 'Texto', description: 'Campo de texto libre' },
    { value: 'select', label: 'Selección', description: 'Lista de opciones predefinidas' }
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
                      onChange={(e) => {
                        setFormData({...formData, tipo: e.target.value});
                        // Limpiar valores si cambia de tipo
                        if (e.target.value !== 'select') {
                          setValoresInput('');
                        }
                      }}
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

            {/* Campo de valores (solo si es tipo 'select') */}
            {formData.tipo === 'select' && (
              <div>
                <label htmlFor="valores" className="block text-sm font-medium text-gray-700 mb-1">
                  Valores disponibles *
                </label>
                <input
                  type="text"
                  id="valores"
                  value={valoresInput}
                  onChange={(e) => setValoresInput(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.valores ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Rojo, Azul, Verde, Amarillo"
                  disabled={loading}
                />
                {errors.valores && (
                  <p className="mt-1 text-sm text-red-600">{errors.valores}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Separe los valores con comas (,). Ejemplo: Pequeño, Mediano, Grande
                </p>
                
                {/* Preview de valores */}
                {valoresInput.trim() && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-1">Vista previa:</p>
                    <div className="flex flex-wrap gap-1">
                      {valoresInput.split(',').map((valor, idx) => {
                        const valorTrim = valor.trim();
                        if (!valorTrim) return null;
                        return (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {valorTrim}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  <li><strong>Selección:</strong> Para opciones fijas que el usuario elegirá de una lista desplegable</li>
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