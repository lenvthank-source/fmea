import React from 'react';
import { FmeaStudioPreview } from './FmeaStudioPreview';

/**
 * Re-exporting FmeaStudioPreview to maintain backward compatibility
 * with existing page imports while delivering the handcrafted quality studio interface.
 */
export const VentrilocDashboard: React.FC<{ compact?: boolean }> = () => {
  return <FmeaStudioPreview />;
};

export default VentrilocDashboard;
