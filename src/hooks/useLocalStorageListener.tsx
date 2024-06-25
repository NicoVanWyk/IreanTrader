import { useEffect } from 'react';

export const useLocalStorageListener = (callback: () => void) => {
    useEffect(() => {
        const handleStorageChange = () => {
            callback();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('local-storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage', handleStorageChange);
        };
    }, [callback]);
};