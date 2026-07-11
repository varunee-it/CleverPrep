import React from 'react';

const Card = ({ children, className = '', onClick, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
