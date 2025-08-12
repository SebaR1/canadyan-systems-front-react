import React from 'react';
import ProductCard from '../Cards/ProductCard/ProductCard';

const FeaturedProducts: React.FC = () => {
  // Datos de ejemplo - puedes moverlos a props o estado más adelante
  const featuredProducts = [
    {
      id: 1,
      image: 'https://picsum.photos/300/200?random=10',
      title: 'KY-PP-S31L-20D Sfp+ 10g Lr 10km Sm Lc Dúplex',
      description: 'Módulo transceptor de fibra óptica',
      price: '$..........'
    },
    {
      id: 2,
      image: 'https://picsum.photos/300/200?random=11',
      title: 'Router WiFi 6 AX3000 Dual Band',
      description: 'Router inalámbrico de alta velocidad',
      price: '$..........'
    },
    {
      id: 3,
      image: 'https://picsum.photos/300/200?random=12',
      title: 'Switch Gigabit 24 Puertos PoE+',
      description: 'Switch administrable con Power over Ethernet',
      price: '$..........'
    }
  ];

  const handleVerMas = (productId: number) => {
    console.log(`Ver más del producto ${productId}`);
    // Aquí puedes agregar la lógica para navegar al detalle del producto
  };

  return (
    <section className="bg-gray-50 py-12 px-4">
      {/* Título de la sección */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Productos destacados
        </h2>
      </div>

      {/* Grid de productos */}
      <div className="grid gap-6">
        {/* En mobile: 1 columna, en tablet: 2 columnas, en desktop: 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              image={product.image}
              title={product.title}
              description={product.description}
              price={product.price}
              onVerMas={() => handleVerMas(product.id)}
              className="w-full max-w-64 mx-auto"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;