import React, { useState } from 'react';
import apiManager from '../../../services/ApiIndex';

interface RegistroClienteProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegistroCliente: React.FC<RegistroClienteProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    razonSocialEmpresa: '',
    cuit: '',
    correoElectronico: '',
    celular: '',
    ciudad: '',
    direccion: '',
    provincia: 'CABA',
    password: '',
    passwordConfirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (error) setError(null);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        razonSocialEmpresa: formData.razonSocialEmpresa,
        cuit: formData.cuit,
        correoElectronico: formData.correoElectronico,
        celular: formData.celular,
        ciudad: formData.ciudad,
        direccion: formData.direccion,
        provincia: formData.provincia,
        password: formData.password
      };

      const response = await apiManager.usuarios.registrar(payload as any);

      if (response.success) {
        setSuccess('¡Cuenta creada exitosamente!');
        setTimeout(() => {
          onClose();
          setFormData({
            nombre: '', apellido: '', razonSocialEmpresa: '', cuit: '',
            correoElectronico: '', celular: '', ciudad: '', direccion: '',
            provincia: 'CABA', password: '', passwordConfirm: ''
          });
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.error || 'Error al crear la cuenta. Intenta nuevamente.');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setFormData({
      nombre: '', apellido: '', razonSocialEmpresa: '', cuit: '',
      correoElectronico: '', celular: '', ciudad: '', direccion: '',
      provincia: 'CABA', password: '', passwordConfirm: ''
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
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">

          {/* Header del modal */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-orange-500 mb-1">¡Crea tu cuenta!</h2>
              <p className="text-xs text-gray-600">SI AÚN NO LO SOS, COMPLETÁ EL FORMULARIO</p>
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
          <div className="p-4 lg:p-8">
            {/* Mensajes de error y éxito */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Fila 1: Nombre | Apellido */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Nombre <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Apellido <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fila 2: Razón social | CUIT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Razón social */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Razón social / Empresa <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="razonSocialEmpresa"
                    value={formData.razonSocialEmpresa}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* CUIT */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    CUIT <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleInputChange}
                    placeholder="XX-XXXXXXXX-X"
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fila 3: Email | Celular */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Correo electrónico */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Correo electrónico <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="correoElectronico"
                    value={formData.correoElectronico}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Celular */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Celular <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="celular"
                    value={formData.celular}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fila 4: Ciudad | Dirección */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ciudad */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Ciudad <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Dirección <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Provincia */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Provincia <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                    disabled={isLoading}
                  >
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

              {/* Fila 6: Contraseña a crear | Confirmar contraseña */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Contraseña a crear */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Contraseña a crear <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-1.318a11.955 11.955 0 01-22.728 0M15 12a3 3 0 11-6 0" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Confirmar contraseña <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-full lg:rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPasswordConfirm ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-1.318a11.955 11.955 0 01-22.728 0M15 12a3 3 0 11-6 0" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  className="w-full lg:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full lg:rounded-lg transition-colors duration-200 touch-manipulation text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando cuenta...
                    </>
                  ) : (
                    'CONTINUAR'
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

export default RegistroCliente;