import React, { useState } from 'react';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login enviado:', formData);
    // Aquí iría la lógica de login
    onClose();
  };

  const handleForgotPassword = () => {
    console.log('Recuperar contraseña');
    // Aquí iría la lógica para recuperar contraseña
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
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
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Contenido del modal */}
          <div className="p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  required
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
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      // Icono ojo abierto (mostrar) - cuando se está mostrando la contraseña
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      // Icono ojo cerrado (ocultar) - cuando está oculta la contraseña
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
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón Ingresar */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 touch-manipulation text-sm"
                >
                  INGRESAR
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