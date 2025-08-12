import React from 'react';

interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  price: string;
  onVerMas?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  description,
  price,
  onVerMas,
  className = ""
}) => {
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

      {/* Botón VER MÁS */}
      <div className="flex justify-center mb-4">
        <button
          onClick={onVerMas}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200 touch-manipulation"
        >
          VER MÁS
        </button>
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
      <div className="text-gray-800 font-medium text-sm">
        {price}
      </div>
    </div>
  );
};

export default ProductCard;