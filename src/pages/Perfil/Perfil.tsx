import React, { useState, useEffect } from 'react';
import apiManager from '../../services/ApiIndex';
import { Usuario } from '../../services/types';

interface UserProfileProps {
  mode?: 'self' | 'admin';
  userId?: number;
  canEdit?: boolean;
  showAllFields?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({
  mode = 'self',
  userId,
  canEdit = true,
  showAllFields = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    razon_social_empresa: '',
    cuit: '',
    correo_electronico: '',
    celular: '',
    ciudad: '',
    direccion: '',
    provincia: '',
    tipo_usuario_nombre: ''
  });

  const [originalData, setOriginalData] = useState(formData);

  // Cargar datos del usuario
  useEffect(() => {
    loadUserData();
  }, [userId, mode]);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (mode === 'admin' && userId) {
        // Admin viendo otro usuario
        response = await apiManager.usuarios.obtenerPorId(userId);
      } else {
        // Usuario viendo su propio perfil
        response = await apiManager.usuarios.obtenerPerfil();
      }

      if (response.success && response.data) {
        const userData = response.data as Usuario;
        const userFormData = {
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          razon_social_empresa: userData.razon_social_empresa || '',
          cuit: userData.cuit || '',
          correo_electronico: userData.correo_electronico || '',
          celular: userData.celular || '',
          ciudad: userData.ciudad || '',
          direccion: userData.direccion || '',
          provincia: userData.provincia || '',
          tipo_usuario_nombre: userData.tipo_usuario_nombre || ''
        };
        
        setFormData(userFormData);
        setOriginalData(userFormData);
      } else {
        setError(response.error || 'Error al cargar los datos del usuario');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Error de conexión al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cuit') {
      // Formatear CUIT automáticamente
      const cleanValue = value.replace(/\D/g, '');
      let formattedValue = cleanValue;
      
      if (cleanValue.length > 2 && cleanValue.length <= 10) {
        formattedValue = cleanValue.slice(0, 2) + '-' + cleanValue.slice(2);
      } else if (cleanValue.length === 11) {
        formattedValue = cleanValue.slice(0, 2) + '-' + cleanValue.slice(2, 10) + '-' + cleanValue.slice(10, 11);
      }
      
      if (cleanValue.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [name]: formattedValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar datos para enviar (mapear nombres del frontend al backend)
      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        razonSocialEmpresa: formData.razon_social_empresa,
        celular: formData.celular,
        ciudad: formData.ciudad,
        direccion: formData.direccion,
        provincia: formData.provincia
      };

      let response;
      
      if (mode === 'admin' && userId) {
        // Admin actualizando otro usuario
        response = await apiManager.usuarios.actualizar(userId, updateData);
      } else {
        // Usuario actualizando su propio perfil
        response = await apiManager.usuarios.actualizarPerfil(updateData);
      }

      if (response.success) {
        setSuccess('Perfil actualizado correctamente');
        setIsEditing(false);
        
        // Actualizar datos originales
        setOriginalData(formData);
        
        // Si es el propio perfil, actualizar el localStorage
        if (mode === 'self' && response.data) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { ...currentUser, ...response.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('storage'));
        }
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(response.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error de conexión al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 py-12 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Cargando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de la sección */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'admin' ? 'Editar Usuario' : 'Mi Perfil'}
          </h1>
          <p className="text-sm text-gray-600">
            {isEditing 
              ? 'Modifica la información y guarda los cambios' 
              : 'Información de tu cuenta'
            }
          </p>
        </div>

        {/* Contenedor principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Mensajes de estado */}
          {error && (
            <div className="mx-6 mt-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="mx-6 mt-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}

          <div className="p-6">
            
            {/* Información del tipo de usuario (solo lectura) */}
            {showAllFields && formData.tipo_usuario_nombre && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    Tipo de usuario: {formData.tipo_usuario_nombre}
                  </span>
                </div>
              </div>
            )}

            {/* Fila 1: Nombre | Apellido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Nombre <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Apellido <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Fila 2: Razón social | CUIT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Razón social / Empresa <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="razon_social_empresa"
                  value={formData.razon_social_empresa}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  CUIT <span className="text-red-500 text-xs">(No editable)</span>
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  disabled={true} // CUIT siempre deshabilitado
                  placeholder="XX-XXXXXXXX-X"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Fila 3: Email | Celular */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Correo electrónico <span className="text-red-500 text-xs">(No editable)</span>
                </label>
                <input
                  type="email"
                  name="correo_electronico"
                  value={formData.correo_electronico}
                  disabled={true} // Email siempre deshabilitado
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Celular <span className="text-orange-500">*</span>
                </label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Fila 4: Ciudad | Dirección */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Ciudad <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Dirección <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Fila 5: Provincia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Provincia <span className="text-orange-500">*</span>
                </label>
                <select
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  required
                >
                  <option value="">Seleccionar provincia</option>
                  <option value="CABA">CABA</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="Tucumán">Tucumán</option>
                  <option value="Entre Ríos">Entre Ríos</option>
                  <option value="Salta">Salta</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Chaco">Chaco</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Santiago del Estero">Santiago del Estero</option>
                  <option value="San Juan">San Juan</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="Río Negro">Río Negro</option>
                  <option value="Formosa">Formosa</option>
                  <option value="Neuquén">Neuquén</option>
                  <option value="Chubut">Chubut</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="La Pampa">La Pampa</option>
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="Tierra del Fuego">Tierra del Fuego</option>
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
              {!isEditing ? (
                // Modo visualización
                canEdit && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 touch-manipulation text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    EDITAR PERFIL
                  </button>
                )
              ) : (
                // Modo edición
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 touch-manipulation text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    CANCELAR
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 touch-manipulation text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        GUARDAR CAMBIOS
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;