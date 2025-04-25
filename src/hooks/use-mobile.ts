
import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkScreenWidth();

    // Add listener for window resize
    window.addEventListener('resize', checkScreenWidth);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenWidth);
    };
  }, [breakpoint]);

  return isMobile;
};
