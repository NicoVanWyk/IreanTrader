// FullMapComponent.tsx
import React from 'react';
import styles from './css/FullMapComponent.module.css';
import { TileType } from '../data/TileTypes';

interface FullMapProps {
    map: TileType[][];
    currentPosition: { x: number; y: number };
}

const FullMapComponent: React.FC<FullMapProps> = ({ map, currentPosition }) => {
    // Function to get tile symbol based on tile type
    const getTileSymbol = (tile: TileType): string => {
        switch (tile) {
            case 'empty':
                return '.';
            case 'city':
                return 'C';
            case 'forest':
                return 'F';
            case 'mountain':
                return 'M';
            case 'river':
                return 'R';
            case 'bridge':
                return 'B';
            case 'road':
                return '*';
            default:
                return '?';
        }
    };

    return (
        <div className={styles.fullMapContainer}>
            {map.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.fullMapRow}>
                    {row.map((tile, columnIndex) => (
                        <div
                            key={`${rowIndex}-${columnIndex}`}
                            className={`${styles.fullMapTile} ${styles[tile]} ${rowIndex === currentPosition.y && columnIndex === currentPosition.x ? styles.currentPosition : ''}`}
                        >
                            {getTileSymbol(tile)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default FullMapComponent;