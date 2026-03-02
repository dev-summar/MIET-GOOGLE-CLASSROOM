import React from 'react';
import { RefreshCw } from 'lucide-react';
import '../../styles/components.css';

function Spinner({ size }) {
  return (
    <div className="spinner-wrap" role="status" aria-label="Loading">
      <RefreshCw size={size ?? 40} className="spinner-icon" />
    </div>
  );
}

export default Spinner;
