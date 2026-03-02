import React from 'react';
import { Inbox } from 'lucide-react';

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <Inbox size={40} className="empty-state-icon" />
      <p>{message || 'No data to display.'}</p>
    </div>
  );
}

export default EmptyState;
