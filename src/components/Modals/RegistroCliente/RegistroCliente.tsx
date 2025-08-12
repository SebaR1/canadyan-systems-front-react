import React, { useState } from 'react';

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
    provincia: '',
    imagen: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cuit') {
      // Formatear CUIT automáticamente
      const cleanValue = value.replace(/\D/g, ''); // Solo números
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
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      imagen: file
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registro enviado:', formData);
    // Aquí iría la lógica de registro
    onClose();
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
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          
          {/* Header del modal */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-orange-500 mb-1">¡Crea tu cuenta!</h2>
              <p className="text-xs text-gray-600">SI AÚN NO LO SOS, COMPLETÁ EL FORMULARIO</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Contenido del modal */}
          <div className="p-4 lg:p-8">
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
                  />
                </div>
              </div>

              {/* Fila 5: Provincia | Código de imagen */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Provincia */}
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
                  >
                    <option value="">CABA</option>
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

                {/* Código de imagen */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Imagen
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageChange}
                      className="hidden"
                      id="imagen-upload"
                    />
                    <label
                      htmlFor="imagen-upload"
                      className="px-4 py-2 border border-gray-300 rounded-full lg:rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      Código de imagen
                    </label>
                    {formData.imagen && (
                      <span className="text-xs text-gray-600 truncate">
                        {formData.imagen.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  className="w-full lg:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full lg:rounded-lg transition-colors duration-200 touch-manipulation text-sm"
                >
                  CONTINUAR
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