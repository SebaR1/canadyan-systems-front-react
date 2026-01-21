import React, { useState, useEffect } from 'react';
import { Usuario } from '../../services/types';
import { TipoUsuario } from '../../services/modules/TiposUsuarioService';

interface UsuarioFormData {
  nombre: string;
  apellido: string;
  razonSocialEmpresa: string;
  cuit: string;
  correoElectronico: string;
  celular: string;
  ciudad: string;
  direccion: string;
  provincia: string;
  tipo_usuario_id: number;
}

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UsuarioFormData) => Promise<string | void>;
  editing?: Usuario | null;
  tiposUsuario: TipoUsuario[];
}

const PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
];

const UsuarioModal: React.FC<UsuarioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editing = null,
  tiposUsuario
}) => {
  const [formData, setFormData] = useState<UsuarioFormData>({
    nombre: '',
    apellido: '',
    razonSocialEmpresa: '',
    cuit: '',
    correoElectronico: '',
    celular: '',
    ciudad: '',
    direccion: '',
    provincia: 'Buenos Aires',
    tipo_usuario_id: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (editing) {
      setFormData({
        nombre: editing.nombre || '',
        apellido: editing.apellido || '',
        razonSocialEmpresa: editing.razon_social_empresa || '',
        cuit: editing.cuit || '',
        correoElectronico: editing.correo_electronico || '',
        celular: editing.celular || '',
        ciudad: editing.ciudad || '',
        direccion: editing.direccion || '',
        provincia: editing.provincia || 'Buenos Aires',
        tipo_usuario_id: editing.tipo_usuario_id || 1
      });
      setGeneratedPassword(null);
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        razonSocialEmpresa: '',
        cuit: '',
        correoElectronico: '',
        celular: '',
        ciudad: '',
        direccion: '',
        provincia: 'Buenos Aires',
        tipo_usuario_id: 1
      });
      setGeneratedPassword(null);
    }
    setErrors({});
    setPasswordCopied(false);
  }, [editing, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cuit') {
      const cleanValue = value.replace(/\D/g, '');
      let formattedValue = cleanValue;

      if (cleanValue.length > 2 && cleanValue.length <= 10) {
        formattedValue = cleanValue.slice(0, 2) + '-' + cleanValue.slice(2);
      } else if (cleanValue.length === 11) {
        formattedValue = cleanValue.slice(0, 2) + '-' + cleanValue.slice(2, 10) + '-' + cleanValue.slice(10, 11);
      }

      if (cleanValue.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: formattedValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.razonSocialEmpresa.trim()) newErrors.razonSocialEmpresa = 'La razón social es requerida';

    if (!formData.cuit.trim()) {
      newErrors.cuit = 'El CUIT es requerido';
    } else {
      const cleanCuit = formData.cuit.replace(/\D/g, '');
      if (cleanCuit.length !== 11) {
        newErrors.cuit = 'El CUIT debe tener 11 dígitos';
      }
    }

    if (!formData.correoElectronico.trim()) {
      newErrors.correoElectronico = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoElectronico)) {
      newErrors.correoElectronico = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const result = await onSubmit(formData);

      if (result && typeof result === 'string') {
        setGeneratedPassword(result);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      } catch (err) {
        console.error('Error al copiar contraseña:', err);
      }
    }
  };

  const handleClose = () => {
    setGeneratedPassword(null);
    onClose();
  };

  if (!isOpen) return null;

  if (generatedPassword) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Usuario Creado Exitosamente
              </h3>

              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium mb-2">
                  Contraseña temporal generada:
                </p>
                <div className="flex items-center justify-between bg-white border border-orange-300 rounded px-3 py-2">
                  <code className="text-sm font-mono text-gray-900">{generatedPassword}</code>
                  <button
                    onClick={handleCopyPassword}
                    className="ml-2 p-1 text-orange-600 hover:text-orange-800"
                    title="Copiar contraseña"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  </button>
                </div>
                {passwordCopied && (
                  <p className="mt-2 text-xs text-green-600">Contraseña copiada</p>
                )}
              </div>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  Guarde esta contraseña en un lugar seguro. No se volverá a mostrar.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="mt-6 w-full inline-flex justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${errors.nombre ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-orange-500 focus:border-orange-500`}
                />
                {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${errors.apellido ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-orange-500 focus:border-orange-500`}
                />
                {errors.apellido && <p className="mt-1 text-xs text-red-600">{errors.apellido}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="razonSocialEmpresa"
                  value={formData.razonSocialEmpresa}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${errors.razonSocialEmpresa ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-orange-500 focus:border-orange-500`}
                />
                {errors.razonSocialEmpresa && <p className="mt-1 text-xs text-red-600">{errors.razonSocialEmpresa}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUIT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  placeholder="XX-XXXXXXXX-X"
                  className={`w-full px-3 py-2 border ${errors.cuit ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-orange-500 focus:border-orange-500`}
                />
                {errors.cuit && <p className="mt-1 text-xs text-red-600">{errors.cuit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="correoElectronico"
                  value={formData.correoElectronico}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${errors.correoElectronico ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-orange-500 focus:border-orange-500`}
                />
                {errors.correoElectronico && <p className="mt-1 text-xs text-red-600">{errors.correoElectronico}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Celular
                </label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <select
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  {PROVINCIAS.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuario <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_usuario_id"
                  value={formData.tipo_usuario_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  {tiposUsuario.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!editing && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Se generará automáticamente una contraseña temporal para el nuevo usuario.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  editing ? 'Actualizar Usuario' : 'Crear Usuario'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsuarioModal;
