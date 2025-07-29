import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white/95 backdrop-blur-sm shadow-sm border-t border-gray-100 py-4">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <Link to="/" className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">IP</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              InfoPulse
            </h1>
          </Link>
          <p className="text-sm text-gray-600">© 2025 InfoPulse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;