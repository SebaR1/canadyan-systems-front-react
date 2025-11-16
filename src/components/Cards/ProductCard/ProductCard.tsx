import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: number;
  image?: string;  // Ahora es opcional
  title: string;
  description: string;
  price: string;
  stock?: number;
  onVerMas?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  title,
  description,
  price,
  stock = 0,
  onVerMas,
  className = ""
}) => {
  const navigate = useNavigate();

  const handleVerMas = () => {
    if (onVerMas) {
      onVerMas();
    } else {
      navigate(`/producto/${id}`);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border-2 border-gray-300 p-4 shadow-sm ${className}`}>
      {/* Imagen del producto o placeholder */}
      <div className="flex justify-center mb-4 h-32">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Si falla la carga de imagen, ocultar y mostrar placeholder
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          // Placeholder inline (mismo diseño que NoImagePlaceholder pero adaptado al tamaño de la card)
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg 
              className="w-12 h-12 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Título del producto */}
      <h3 className="text-gray-800 font-semibold text-sm mb-2 leading-5">
        {title}
      </h3>

      {/* Descripción */}
      <p className="text-gray-600 text-xs mb-4 leading-4">
        {description}
      </p>

      {/* Precio */}
      <div className="text-gray-800 font-medium text-sm mb-4">
        {price}
      </div>

      {/* Botón VER MÁS */}
      <div className="flex justify-center">
        <button
          onClick={handleVerMas}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200 touch-manipulation"
        >
          VER MÁS
        </button>
      </div>
    </div>
  );
};

export default ProductCard;