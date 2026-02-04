import React, { useState } from 'react';
import apiManager from '../../../services/ApiIndex';
import { UsuarioLogin } from '../../../services/types';

interface AccesoClienteProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccesoCliente: React.FC<AccesoClienteProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    recordarPassword: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar datos de login
      const loginData: UsuarioLogin = {
        email: formData.email,
        password: formData.password,
        recordarPassword: formData.recordarPassword
      };

      // Usar el servicio de usuarios para hacer login
      const response = await apiManager.usuarios.login(loginData);

      if (response.success && response.data) {
        // Tras normalización en ApiClient, response.data ya es el payload interno { usuario, token, ... }
        const { usuario, token } = response.data as any;

        if (!usuario) {
          setError('No se recibió información de usuario. Intenta nuevamente.');
          return;
        }
        
        // Guardar token usando el ApiManager
        if (token) apiManager.setAuthToken(token);
        
        // Guardar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(usuario));
        
        // Disparar evento para que otros componentes se enteren del cambio
        window.dispatchEvent(new Event('storage'));
        
        setSuccess('¡Login exitoso!');

        // Si marcó "Recordar contraseña", pedir al navegador que guarde las credenciales
        if (formData.recordarPassword && window.navigator.credentials && (window as any).PasswordCredential) {
          try {
            const CredentialClass = (window as any).PasswordCredential;
            const credential = new CredentialClass({
              id: formData.email,
              password: formData.password,
              name: usuario.nombre || usuario.email || formData.email
            });
            navigator.credentials.store(credential);
          } catch (e) {
            // No afecta la funcionalidad si falla
          }
        }

        // Cerrar modal después de un breve delay
        setTimeout(() => {
          onClose();
          // Limpiar formulario
          setFormData({
            email: '',
            password: '',
            recordarPassword: false
          });
          setSuccess(null);
          // No redirigir; el usuario queda logueado y el modal se cierra
        }, 1500);
        
      } else {
        // Error en el login
        setError(response.error || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
      
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Por favor, ingresa tu email para recuperar la contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiManager.usuarios.recuperarPassword(formData.email);
      
      if (response.success) {
        setSuccess('Se ha enviado un enlace de recuperación a tu email.');
      } else {
        setError(response.error || 'Error al enviar el enlace de recuperación.');
      }
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Limpiar estados al cerrar
    setError(null);
    setSuccess(null);
    setFormData({
      email: '',
      password: '',
      recordarPassword: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          
          {/* Header del modal */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-orange-500 mb-1">Acceso Cliente</h2>
              <p className="text-xs text-gray-600">INGRESÁ TUS DATOS PARA CONTINUAR</p>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* Contenido del modal */}
          <div className="p-6">
            {/* Mensajes de error y éxito */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Email <span className="text-orange-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Contraseña <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Recordar contraseña */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="recordarPassword"
                  id="recordarPassword"
                  checked={formData.recordarPassword}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="recordarPassword" className="ml-2 text-xs text-gray-600">
                  Recordar contraseña
                </label>
              </div>

              {/* ¿Olvidaste tu contraseña? */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-orange-500 hover:text-orange-600 transition-colors underline"
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="text-center">
                  <p>Datos Admin ejemplo</p>
                  <p>Email: admin@ejemplo.com</p>
                  <p>Contraseña: password</p>
              </div>
              <div className="text-center">
                  <p>Datos Cliente ejemplo</p>
                  <p>Email: usuario@ejemplo.com</p>
                  <p>Contraseña: password</p>
              </div>


              {/* Botón Ingresar */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 touch-manipulation text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ingresando...
                    </>
                  ) : (
                    'INGRESAR'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccesoCliente;