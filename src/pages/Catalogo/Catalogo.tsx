import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

interface FilterState {
  marca: {
    kingwell: boolean;
  };
  duplex: {
    sfp1gb: boolean;
    '10km': boolean;
    '20km': boolean;
    '40km': boolean;
  };
  bidi: {
    sfp1gb: boolean;
    '10km': boolean;
    '20km': boolean;
    '40km': boolean;
    '60km': boolean;
    '80km': boolean;
  };
}

const Catalogo: React.FC = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('precio');
  const [filters, setFilters] = useState<FilterState>({
    marca: {
      kingwell: false
    },
    duplex: {
      sfp1gb: false,
      '10km': false,
      '20km': false,
      '40km': false
    },
    bidi: {
      sfp1gb: false,
      '10km': false,
      '20km': false,
      '40km': false,
      '60km': false,
      '80km': false
    }
  });

  // Datos de ejemplo - después vendrán de la BD
  const products = [
    {
      id: 1,
      image: 'https://picsum.photos/300/200?random=1',
      title: 'KY-PP-S31L-20D Sfp+ 10g Lr 10km Sm Lc Dúplex',
      description: 'Módulo transceptor de fibra óptica mono modo SFP+ modelo KY-PP-S-31DLC20D, de 10 Giga bits, con conector LC/UPC dual de 1310 nm para conexiones de hasta 20 km.',
      price: '$.........',
      inStock: true
    },
    {
      id: 2,
      image: 'https://picsum.photos/300/200?random=2',
      title: 'KY-PP-S31L-20D Sfp+ 10g Lr 10km Sm Lc Dúplex',
      description: 'Módulo transceptor de fibra óptica mono modo SFP+ modelo KY-PP-S-31DLC20D, de 10 Giga bits, con conector LC/UPC dual de 1310 nm para conexiones de hasta 20 km.',
      price: '$.........',
      inStock: false
    },
      {
      id: 3,
      image: 'https://picsum.photos/300/200?random=2',
      title: 'KY-PP-S31L-20D Sfp+ 10g Lr 10km Sm Lc Dúplex',
      description: 'Módulo transceptor de fibra óptica mono modo SFP+ modelo KY-PP-S-31DLC20D, de 10 Giga bits, con conector LC/UPC dual de 1310 nm para conexiones de hasta 20 km.',
      price: '$.........',
      inStock: false
    },
      {
      id: 4,
      image: 'https://picsum.photos/300/200?random=2',
      title: 'KY-PP-S31L-20D Sfp+ 10g Lr 10km Sm Lc Dúplex',
      description: 'Módulo transceptor de fibra óptica mono modo SFP+ modelo KY-PP-S-31DLC20D, de 10 Giga bits, con conector LC/UPC dual de 1310 nm para conexiones de hasta 20 km.',
      price: '$.........',
      inStock: false
    }
  ];

  const handleFilterChange = (category: keyof FilterState, item: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: !prev[category][item as keyof typeof prev[typeof category]]
      }
    }));
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-4">
          
          {/* Breadcrumb */}
          <nav className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </Link>
              <span>&gt;</span>
              <Link to="/catalogo" className="hover:text-orange-500 transition-colors">
                Catálogo
              </Link>
              <span>&gt;</span>
              <span className="text-gray-400">Conectividad</span>
              <span>&gt;</span>
              <span className="text-gray-900 font-medium">Módulos transceptores</span>
            </div>
          </nav>

          <div className="flex gap-6">
            
            {/* Sidebar de filtros - Solo desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                
                {/* Catálogo */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-gray-900 mb-2">Catálogo</h3>
                  <div className="text-sm text-orange-500 font-medium">CONECTIVIDAD</div>
                </div>

                {/* Subcategoría */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-gray-900 mb-2">Subcategoría</h3>
                  <div className="text-xs text-gray-700 font-medium">MÓDULOS TRANSCEPTORES</div>
                </div>

                {/* Marca */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-gray-900 mb-3">Marca</h3>
                  <label className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.marca.kingwell}
                      onChange={() => handleFilterChange('marca', 'kingwell')}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>Kingwell</span>
                  </label>
                </div>

                {/* DUPLEX */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-orange-500 mb-3">DUPLEX</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-xs">
                      <input
                        type="checkbox"
                        checked={filters.duplex.sfp1gb}
                        onChange={() => handleFilterChange('duplex', 'sfp1gb')}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>SFP 1GB</span>
                    </label>
                    <div className="ml-6 space-y-1">
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.duplex['10km']}
                          onChange={() => handleFilterChange('duplex', '10km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>10KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.duplex['20km']}
                          onChange={() => handleFilterChange('duplex', '20km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>20KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.duplex['40km']}
                          onChange={() => handleFilterChange('duplex', '40km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>40KM</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* BIDI */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-orange-500 mb-3">BIDI</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-xs">
                      <input
                        type="checkbox"
                        checked={filters.bidi.sfp1gb}
                        onChange={() => handleFilterChange('bidi', 'sfp1gb')}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>SFP 1GB</span>
                    </label>
                    <div className="ml-6 space-y-1">
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['10km']}
                          onChange={() => handleFilterChange('bidi', '10km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>10KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['20km']}
                          onChange={() => handleFilterChange('bidi', '20km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>20KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['40km']}
                          onChange={() => handleFilterChange('bidi', '40km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>40KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['60km']}
                          onChange={() => handleFilterChange('bidi', '60km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>60KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['80km']}
                          onChange={() => handleFilterChange('bidi', '80km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>80KM</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Área principal */}
            <div className="flex-1">
              
              {/* Barra de filtros mobile + ordenar */}
              <div className="flex justify-between items-center mb-6">
                
                {/* Botón filtrar - Solo mobile */}
                <button
                  onClick={toggleMobileFilters}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filtrar</span>
                </button>

                {/* Ordenar por */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="precio">Precio</option>
                    <option value="nombre">Nombre</option>
                    <option value="mas-vendido">Más vendido</option>
                    <option value="fecha">Más reciente</option>
                  </select>
                </div>
              </div>

              {/* Grid de productos */}
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border-2 border-gray-300 p-4 shadow-sm">
                    
                    {/* Imagen */}
                    <div className="flex justify-center mb-4">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-32 object-contain"
                      />
                    </div>

                    {/* Título */}
                    <h3 className="text-gray-800 font-semibold text-sm mb-2 leading-5">
                      {product.title}
                    </h3>

                    {/* Descripción */}
                    <p className="text-gray-600 text-xs mb-4 leading-4">
                      {product.description}
                    </p>

                    {/* Precio */}
                    <div className="text-gray-800 font-medium text-sm mb-4">
                      {product.price}
                    </div>

                    {/* Botón */}
                    <div className="flex justify-center">
                      {product.inStock ? (
                        <button className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200 touch-manipulation text-sm">
                          VER MÁS
                        </button>
                      ) : (
                        <button className="bg-black text-white font-semibold py-2 px-6 rounded-full text-sm cursor-not-allowed">
                          SIN STOCK
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de filtros mobile */}
        {showMobileFilters && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={toggleMobileFilters}
            />
            
            {/* Panel de filtros */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-lg p-4 z-50 lg:hidden max-h-[80vh] overflow-y-auto">
              
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h3 className="font-bold text-lg">Filtros</h3>
                <button 
                  onClick={toggleMobileFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Contenido de filtros - igual que el sidebar */}
              <div className="space-y-6">
                {/* Marca */}
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Marca</h4>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.marca.kingwell}
                      onChange={() => handleFilterChange('marca', 'kingwell')}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>Kingwell</span>
                  </label>
                </div>

                {/* DUPLEX */}
                <div>
                  <h4 className="font-bold text-sm text-orange-500 mb-3">DUPLEX</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.duplex.sfp1gb}
                        onChange={() => handleFilterChange('duplex', 'sfp1gb')}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>SFP 1GB</span>
                    </label>
                    <div className="ml-6 space-y-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.duplex['10km']}
                          onChange={() => handleFilterChange('duplex', '10km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>10KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.duplex['20km']}
                          onChange={() => handleFilterChange('duplex', '20km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>20KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.duplex['40km']}
                          onChange={() => handleFilterChange('duplex', '40km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>40KM</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* BIDI */}
                <div>
                  <h4 className="font-bold text-sm text-orange-500 mb-3">BIDI</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.bidi.sfp1gb}
                        onChange={() => handleFilterChange('bidi', 'sfp1gb')}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>SFP 1GB</span>
                    </label>
                    <div className="ml-6 space-y-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['10km']}
                          onChange={() => handleFilterChange('bidi', '10km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>10KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['20km']}
                          onChange={() => handleFilterChange('bidi', '20km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>20KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['40km']}
                          onChange={() => handleFilterChange('bidi', '40km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>40KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['60km']}
                          onChange={() => handleFilterChange('bidi', '60km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>60KM</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={filters.bidi['80km']}
                          onChange={() => handleFilterChange('bidi', '80km')}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>80KM</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones del modal */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button 
                  onClick={toggleMobileFilters}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium"
                >
                  Limpiar filtros
                </button>
                <button 
                  onClick={toggleMobileFilters}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Catalogo;