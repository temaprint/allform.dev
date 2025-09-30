import React, { useState, useEffect } from 'react';
import { FileText, Edit3, Globe } from 'lucide-react';

const FormCard = ({ form }) => {
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Listen for language changes from parent
    const handleLanguageChange = (event) => {
      setCurrentLang(event.detail);
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);

  const getTitle = () => {
    return currentLang === 'es' && form.titleEs ? form.titleEs : form.title;
  };

  const getDescription = () => {
    return currentLang === 'es' && form.descriptionEs ? form.descriptionEs : form.description;
  };

  const getCategory = () => {
    return currentLang === 'es' && form.categoryEs ? form.categoryEs : form.category;
  };

  const getDetailsText = () => {
    return currentLang === 'es' ? 'Ver Detalles' : 'View Details';
  };

  return (
    <a 
      href={`/pdf/${form.id}`}
      className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-blue-200 cursor-pointer"
    >
      <div className="relative h-52 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        <img 
          src={form.thumbnail} 
          alt={getTitle()}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/50 transition-all duration-300"></div>
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            {getCategory()}
          </span>
        </div>
        
        {/* PDF Icon */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* Language Indicator */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
            <Globe className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {getTitle()}
        </h3>
        <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
          {getDescription()}
        </p>
        
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <Edit3 className="w-4 h-4" />
            <span>{getDetailsText()}</span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default FormCard;