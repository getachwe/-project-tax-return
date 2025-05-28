import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-right mb-4 md:mb-0">
            <p className="text-gray-600">
              © {new Date().getFullYear()} מחשבון החזרי מס. כל הזכויות שמורות.
            </p>
          </div>
          <div className="flex space-x-6 space-x-reverse">
            <a href="#" className="text-gray-500 hover:text-blue-700 transition-colors duration-200">
              תנאי שימוש
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-700 transition-colors duration-200">
              מדיניות פרטיות
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-700 transition-colors duration-200">
              צור קשר
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};