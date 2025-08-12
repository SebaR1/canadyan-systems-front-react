import React from 'react';
import Header from '../../components/Header/Header';
import Carrousel from '../../components/CarrouselHome/Carrousel';
import FeaturedProductos from '../../components/FeaturedProductos/FeaturedProductos';
import Footer from '../../components/Footer/Footer';

const Home: React.FC = () => {
  return (
    <>
      <Header />
      <Carrousel />
      <FeaturedProductos />
      <Footer />
    </>
  );
};

export default Home;