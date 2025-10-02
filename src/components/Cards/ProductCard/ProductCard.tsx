import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: number;
  image: string;
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
      // Si hay una función personalizada, usarla
      onVerMas();
    } else {
      // Por defecto, navegar a la página de detalle del producto
      navigate(`/producto/${id}`);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border-2 border-gray-300 p-4 shadow-sm ${className}`}>
      {/* Imagen del producto */}
      <div className="flex justify-center mb-4">
        <img
          src={image}
          alt={title}
          className="w-full h-32 object-contain"
        />
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