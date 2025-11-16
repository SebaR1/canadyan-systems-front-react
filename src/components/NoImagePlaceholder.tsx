import React from 'react';

const NoImagePlaceholder: React.FC = () => {
  return (
    <div className="w-full max-w-md bg-gray-50 rounded-2xl border-2 border-gray-300 p-6 flex flex-col items-center justify-center min-h-80">
      {/* Ícono SVG de imagen */}
      <svg 
        className="w-24 h-24 text-gray-400 mb-4" 
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
      
      {/* Texto */}
      <p className="text-gray-500 font-medium">Sin imagen disponible</p>
    </div>
  );
};

export default NoImagePlaceholder;