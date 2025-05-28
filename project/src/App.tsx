import React from 'react';
import { Calculator } from './components/Calculator';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TaxCalculatorProvider } from './context/TaxCalculatorContext';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-heebo">
      <TaxCalculatorProvider>
        <Header />
        <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <Calculator />
        </main>
        <Footer />
      </TaxCalculatorProvider>
    </div>
  );
}

export default App;