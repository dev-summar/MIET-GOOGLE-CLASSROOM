import React from 'react';
import { AlertCircle } from 'lucide-react';
import '../../styles/components.css';

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message">
      <AlertCircle size={20} className="error-message-icon" />
      <span className="error-message-text">{message}</span>
      {onRetry && (
        <button type="button" className="error-message-retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
