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
  isFavorito?: boolean;
  onToggleFavorito?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  title,
  description,
  price,
  stock = 0,
  onVerMas,
  className = "",
  isFavorito = false,
  onToggleFavorito
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
      <h3 className="text-gray-800 font-semibold text-s mb-2 leading-5 break-words">
        {title}
      </h3>

      {/* Descripción - ✅ CORREGIDO: Agregado break-words y line-clamp */}
      <p className="text-gray-600 text-sm mb-4 leading-4 break-words line-clamp-3">
        {description}
      </p>

      {/* Precio */}
      <div className="text-gray-800 font-medium text-sm mb-1">
        {price}
      </div>

      {/* Botones: VER MÁS + Favorito */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={handleVerMas}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200 touch-manipulation"
        >
          VER MÁS
        </button>

        {onToggleFavorito && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorito(); }}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label={isFavorito ? 'Remover de favoritos' : 'Agregar a favoritos'}
          >
            <svg
              className={`w-6 h-6 transition-colors ${isFavorito ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
              fill={isFavorito ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={isFavorito ? 0 : 1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.716-1.607-2.377-2.733-4.313-2.733C5.648 3.75 3.5 5.765 3.5 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;