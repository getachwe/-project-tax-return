import React from 'react';
import { Calculator } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Calculator className="h-8 w-8 text-blue-700" />
          <h1 className="mr-3 text-2xl font-bold text-gray-900">מחשבון החזרי מס</h1>
        </div>
        <nav>
          <ul className="flex space-x-4 space-x-reverse">
            <li>
              <a href="#" className="text-gray-700 hover:text-blue-700 transition-colors duration-200">
                עזרה
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-blue-700 transition-colors duration-200">
                אודות
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};