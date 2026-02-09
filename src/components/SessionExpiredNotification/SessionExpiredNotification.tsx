import React, { useEffect } from 'react';

interface SessionExpiredNotificationProps {
  show: boolean;
  onClose: () => void;
}

const SessionExpiredNotification: React.FC<SessionExpiredNotificationProps> = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      // Auto-cerrar después de 5 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] animate-slide-in">
      <div className="bg-white border-l-4 border-orange-500 px-6 py-4 rounded-lg shadow-2xl max-w-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Sesión expirada</h3>
            <p className="mt-1 text-sm text-gray-600">Tu sesión ha expirado. Por favor, inicia sesión nuevamente.</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredNotification;
