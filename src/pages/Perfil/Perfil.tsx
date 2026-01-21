import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
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
    tipo_usuario_nombre: '',
    tipo_usuario_id: 1
  });

  const [originalData, setOriginalData] = useState(formData);
  const [tiposUsuario, setTiposUsuario] = useState<Array<{ id: number; nombre: string }>>([]);

  // Verificar si el usuario actual es admin
  const isAdmin = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user.tipo_usuario_id === 2;
  };

  // Cargar tipos de usuario
  useEffect(() => {
    const cargarTiposUsuario = async () => {
      try {
        const response = await apiManager.tiposUsuario.listar();
        if (response.success && response.data) {
          setTiposUsuario(response.data.tipos);
        }
      } catch (error) {
        console.error('Error cargando tipos de usuario:', error);
      }
    };

    cargarTiposUsuario();
  }, []);

  // Cargar datos del usuario
  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mode]);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (mode === 'admin' && userId) {
        response = await apiManager.usuarios.obtenerPorId(userId);
      } else {
        response = await apiManager.usuarios.obtenerPerfil();
      }

      if (response.success && response.data) {
        // Manejar tanto { usuario: {...} } como {...} directamente
        let userData: Usuario;
        
        if ('usuario' in response.data) {
          userData = (response.data as any).usuario;
        } else {
          userData = response.data as Usuario;
        }
        
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
          tipo_usuario_nombre: userData.tipo_usuario_nombre || '',
          tipo_usuario_id: userData.tipo_usuario_id || 1
        };
        
        setFormData(userFormData);
        setOriginalData(userFormData);
      } else {
        setError(response.message || 'Error al cargar el perfil');
      }
    } catch (err) {
      setError('Error de conexión al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'cuit') {
      // Formatear CUIT automáticamente
      const cleanValue = value.replace(/\D/g, ''); // Solo números
      let formattedValue = cleanValue;

      // Solo formatear si hay suficientes números, no si se está borrando
      if (cleanValue.length > 2 && cleanValue.length <= 10) {
        formattedValue = cleanValue.slice(0, 2) + '-' + cleanValue.slice(2);
      } else if (cleanValue.length === 11) {
        formattedValue = cleanValue.slice(0, 2) + '-' + cleanValue.slice(2, 10) + '-' + cleanValue.slice(10, 11);
      }

      // Limitar a 11 números máximo
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

    setError(null);
    setSuccess(null);
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
        provincia: formData.provincia,
        ...(isAdmin() && {
          cuit: formData.cuit,
          correoElectronico: formData.correo_electronico,
          tipoUsuarioId: formData.tipo_usuario_id
        })
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
        }
      } else {
        setError(response.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      setError('Error de conexión al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[91vh] bg-gray-100">
        <div className="max-w-4xl mx-auto py-4 px-4">
          
          {/* Breadcrumb */}
          <nav className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-medium">
                Mi Perfil
              </span>
            </div>
          </nav>

          {/* Contenido principal en tarjeta blanca */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'admin' ? 'Perfil de Usuario' : 'Mi Perfil'}
              </h1>
              
              {canEdit && !isLoading && (
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Editar Perfil
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Estados de carga y error */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Cargando perfil...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4">
                {success}
              </div>
            )}

            {/* Formulario del perfil */}
            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="Ingresa tu nombre (opcional)"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="Ingresa tu apellido (opcional)"
                  />
                </div>

                {/* Razón Social */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="razon_social_empresa"
                    value={formData.razon_social_empresa}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                {/* CUIT */}
                {showAllFields && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CUIT
                    </label>
                    <input
                      type="text"
                      name="cuit"
                      value={formData.cuit}
                      onChange={handleInputChange}
                      disabled={!isEditing || !isAdmin()}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        !isEditing || !isAdmin() ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`}
                      placeholder="20-12345678-9"
                    />
                  </div>
                )}

                {/* Email */}
                {showAllFields && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      name="correo_electronico"
                      value={formData.correo_electronico}
                      onChange={handleInputChange}
                      disabled={!isEditing || !isAdmin()}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        !isEditing || !isAdmin() ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                )}

                {/* Celular */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular
                  </label>
                  <input
                    type="tel"
                    name="celular"
                    value={formData.celular}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="11-1234-5678"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="Buenos Aires"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="Av. Corrientes 1234"
                  />
                </div>

                {/* Provincia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="Buenos Aires"
                  />
                </div>

                {/* Tipo de Usuario */}
                {showAllFields && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Usuario
                    </label>
                    {isAdmin() && isEditing ? (
                      <select
                        name="tipo_usuario_id"
                        value={formData.tipo_usuario_id || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const tipoSeleccionado = tiposUsuario.find(t => t.id === value);
                          setFormData(prev => ({
                            ...prev,
                            tipo_usuario_id: value,
                            tipo_usuario_nombre: tipoSeleccionado?.nombre || ''
                          }));
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        {tiposUsuario.map(tipo => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="tipo_usuario_nombre"
                        value={formData.tipo_usuario_nombre}
                        disabled={true}
                        className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                        placeholder="Usuario"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Información adicional */}
            {!isLoading && (
              <div className="mt-6 pt-6 border-gray-200">
                {!isAdmin() && (
                  <p className="text-sm text-gray-500 mt-1">
                    El correo electrónico y CUIT no pueden ser modificados. Para cambios contacta al administrador.
                  </p>
                )}
                {isAdmin() && (
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    Como administrador, puedes editar todos los campos incluyendo CUIT, correo electrónico y tipo de usuario.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default UserProfile;