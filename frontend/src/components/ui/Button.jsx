import React from 'react';
import '../../styles/components.css';

function Button({ children, variant = 'primary', disabled, type = 'button', className, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn btn-${variant} ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
