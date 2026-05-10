import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon: Icon, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 focus:ring-blue-500",
    secondary: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    text: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4",
    ghost: "bg-white text-gray-700 hover:bg-gray-100 shadow-md",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon size={20} />}
    </motion.button>
  );
};

export default Button;
