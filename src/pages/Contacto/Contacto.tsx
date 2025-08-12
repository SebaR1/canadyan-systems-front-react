import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const Contacto: React.FC = () => {
  const [formData, setFormData] = useState({
    nombreApellido: '',
    cuit: '',
    correoElectronico: '',
    celular: '',
    localidad: '',
    razonSocialEmpresa: '',
    mensaje: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que tenga al menos celular o email
    if (!formData.celular && !formData.correoElectronico) {
      alert('Debe completar al menos el celular o el correo electrónico');
      return;
    }
    
    console.log('Formulario enviado:', formData);
    // Aquí puedes agregar la lógica para enviar el formulario
  };

  const handleCall = () => {
    window.location.href = 'tel:+541170093111';
  };

  const handleEmail = () => {
    window.location.href = 'mailto:ventas@canadian.com.ar';
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          
          {/* Breadcrumb */}
          <nav className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Link to="/" className="hover:text-orange-500 text-gray-400 transition-colors">
                Inicio
              </Link>
              <span>&gt;</span>
              <span className="text-gray-800 font-medium">Contacto</span>
            </div>
          </nav>

          {/* Contenido principal en tarjeta blanca */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:p-8">
            
            {/* Layout responsivo: columna en mobile, 2 columnas en desktop */}
            <div className="flex flex-col lg:flex-row lg:gap-12">
              
              {/* Sidebar izquierdo - Información de contacto */}
              <div className="lg:w-1/3 mb-6 lg:mb-0">
                <h1 className="text-xl font-bold text-gray-900 mb-6">
                  Comunícate con nosotros
                </h1>

                <div className="space-y-4">
                  {/* Teléfono con icono */}
                  <button
                    onClick={handleCall}
                    className="flex items-center space-x-3 text-orange-500 hover:text-orange-600 transition-colors touch-manipulation"
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.5 3.5C18.25 1.25 15.2 0 12 0 5.42 0 .08 5.34.08 11.93c0 2.1.54 4.15 1.57 5.96L0 24l6.2-1.63c1.73.94 3.67 1.43 5.65 1.43h.01c6.58 0 11.93-5.34 11.93-11.93 0-3.19-1.24-6.19-3.49-8.44zM12 21.78c-1.78 0-3.53-.48-5.06-1.39l-.36-.21-3.75.98.99-3.64-.23-.37c-.98-1.56-1.5-3.37-1.5-5.22 0-5.4 4.39-9.78 9.78-9.78 2.61 0 5.07 1.02 6.92 2.87 1.85 1.85 2.87 4.31 2.87 6.92-.01 5.4-4.4 9.78-9.78 9.78zm5.37-7.33c-.29-.15-1.74-.86-2.01-.96s-.47-.15-.66.15-.76.96-.93 1.16-.34.22-.63.07c-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03s-.02-.46.13-.61c.13-.13.29-.34.44-.51s.19-.29.29-.48c.1-.19.05-.36-.03-.51s-.66-1.59-.91-2.18c-.24-.57-.48-.49-.66-.5-.17-.01-.36-.01-.55-.01s-.51.07-.78.36c-.27.29-1.03 1.01-1.03 2.47s1.06 2.87 1.21 3.06c.15.19 2.09 3.19 5.06 4.48.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.19-.56-.34z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">+54 11 7009-3111</span>
                  </button>

                  {/* Email con icono */}
                  <button
                    onClick={handleEmail}
                    className="flex items-center space-x-3 text-orange-500 hover:text-orange-600 transition-colors touch-manipulation"
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">ventas@canadian.com.ar</span>
                  </button>
                </div>
              </div>

              {/* Línea divisoria vertical en desktop, horizontal en mobile */}
              <div className="hidden lg:block w-px bg-gray-700 mx-4"></div>
              <div className="lg:hidden border-t border-gray-700 my-6"></div>

              {/* Formulario derecho */}
              <div className="lg:w-2/3">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Fila 1: Nombre y CUIT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Nombre y Apellido */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Nombre y Apellido <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombreApellido"
                        value={formData.nombreApellido}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        required
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
                        className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Fila 2: Email y Localidad */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Correo electrónico */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Correo electrónico {!formData.celular && <span className="text-orange-500">*</span>}
                      </label>
                      <input
                        type="email"
                        name="correoElectronico"
                        value={formData.correoElectronico}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        required={!formData.celular}
                      />
                    </div>

                    {/* Localidad */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Localidad
                      </label>
                      <input
                        type="text"
                        name="localidad"
                        value={formData.localidad}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Fila 3: Celular y Razón social */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Celular */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Celular {!formData.correoElectronico && <span className="text-orange-500">*</span>}
                      </label>
                      <input
                        type="tel"
                        name="celular"
                        value={formData.celular}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        required={!formData.correoElectronico}
                      />
                    </div>

                    {/* Razón social / Empresa */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Razón social / Empresa <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="razonSocialEmpresa"
                        value={formData.razonSocialEmpresa}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Fila 4: Mensaje - Ancho completo */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Mensaje <span className="text-orange-500">*</span>
                    </label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-500 rounded-2xl focus:outline-none focus:border-orange-500 transition-colors resize-vertical text-sm"
                      required
                    ></textarea>
                  </div>

                  {/* Botón Enviar - Alineado a la derecha */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2 px-8 rounded transition-colors duration-200 touch-manipulation text-sm"
                    >
                      ENVIAR
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Contacto;