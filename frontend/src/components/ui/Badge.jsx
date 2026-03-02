import React from 'react';
import '../../styles/components.css';

function Badge({ children, variant, className }) {
  return <span className={`badge badge-${variant || 'default'} ${className || ''}`.trim()}>{children}</span>;
}

export default Badge;
