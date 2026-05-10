import React from 'react';
import Hero from '../components/Hero';
import ServicesSection from '../components/ServicesSection';

const HomePage = () => {
  return (
    <>
      <Hero />
      <div id="services">
        <ServicesSection />
      </div>
    </>
  );
};

export default HomePage;
