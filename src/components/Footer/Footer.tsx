import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [emailCopied, setEmailCopied] = useState(false);

  const handleSuscribirse = () => {
    console.log('Suscribirse al newsletter');
    // Aquí puedes agregar la lógica de suscripción
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('ventas@canadian.com.ar');
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar email:', err);
    }
  };

  return (
    <footer className="text-white" style={{ backgroundColor: '#333030ff' }}>
      {/* Contenido principal del footer */}
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Layout responsive: columna en mobile, filas en desktop */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">
            
            {/* Sección izquierda - Solo Logo */}
            <div className="flex-1 lg:max-w-xs">
              {/* Logo y texto de la empresa */}
              <div className="flex items-center flex-col space-x-3">
                <img 
                  src={`${process.env.PUBLIC_URL}/images/logo.png`} 
                  alt="Logo" 
                  className="h-16 max-w-32 mb-4"
                />                
                <div className='flex flex-col justify-start items-start space-y-1'>
                  <div className="text-sm font-medium text-white">CANADIAN SISTEMAS</div>
                  <div className="text-xs text-gray-300">SEGURIDAD Y CONTROL</div>
                </div>
              </div>
            </div>

            {/* Sección central - Newsletter */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <p className="text-sm text-gray-300 leading-5">
                Recibí las últimas novedades en tu correo electrónico.
              </p>
              <button
                onClick={handleSuscribirse}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 touch-manipulation text-sm"
              >
                SUSCRIBITE AQUÍ
              </button>
            </div>

            {/* Sección derecha - Contacto */}
            <div className="flex-1 lg:max-w-xs space-y-6">
              <h3 className="text-lg font-bold text-white">
                CONTÁCTANOS
              </h3>
              
              <div className="space-y-4">
                {/* Teléfono - WhatsApp */}
                <a
                  href="https://wa.me/5491170093111"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-white hover:text-orange-400 transition-colors duration-200 touch-manipulation w-fit"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-sm">+54 11 7009-3111</span>
                </a>

                {/* Email */}
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center space-x-3 text-white hover:text-orange-400 transition-colors duration-200 touch-manipulation relative w-fit"
                  title="Copiar email"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-sm">ventas@canadian.com.ar</span>
                  {emailCopied && (
                    <span className="absolute -bottom-8 left-0 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      ✓ Email copiado
                    </span>
                  )}
                </button>

                {/* Botón de arrepentimiento */}
                <div className="pt-2">
                  <button className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200 underline touch-manipulation">
                    Botón de arrepentimiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-600 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-gray-400 text-center lg:text-left leading-4">
            Copyright CANADIAN SISTEMAS 2025. Imágenes ilustrativas, los productos pueden presentar variaciones en cuanto a diseño y variedad.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;