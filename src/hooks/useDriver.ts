import { useContext } from 'react';
import { DriverContext, DriverContextType } from '../context/DriverContext';

export const useDriver = (): DriverContextType => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};

