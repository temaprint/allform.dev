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
    <div className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-blue-200">
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
        
        {/* Form ID Badge */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-mono">
            {form.id.replace('form-', '')}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {getTitle()}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {getDescription()}
        </p>
        
        {/* Form Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.65M15 6.75a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>PDF Form</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Editable</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <a 
            href={`/pdf/${form.id}`}
            className="inline-flex items-center space-x-2 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <span>{currentLang === 'es' ? 'Ver' : 'View'}</span>
          </a>
          <a 
            href={`/edit/${form.id}`}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>{currentLang === 'es' ? 'Editar' : 'Edit'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FormCard;