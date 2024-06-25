// MapComponent.tsx
import React from 'react';
import styles from './css/MapComponent.module.css';
import { TileType } from '../data/TileTypes';

interface MapProps {
    map: TileType[][];
    onTileClick: (x: number, y: number, moveCost: number) => void;
    currentPosition: { x: number; y: number };
    movePoints: number;
}

const MapComponent: React.FC<MapProps> = ({ map, onTileClick, currentPosition, movePoints }) => {
    // Function to determine if a tile is out of range
    const isOutOfRange = (x: number, y: number): boolean => {
        const tile = map[y][x];
        if (tile === 'river') {
            return true; // River tiles are always out of range
        } else if (tile === 'mountain') {
            return movePoints < 2; // Mountain tiles are out of range if less than 2 move points left
        } else {
            const distance = Math.max(Math.abs(currentPosition.x - x), Math.abs(currentPosition.y - y));
            return distance > movePoints;
        }
    };

    // Function to handle tile click
    const handleClick = (x: number, y: number) => {
        if (!isOutOfRange(x, y)) {
            const moveCost = map[y][x] === 'mountain' ? 2 : 1;
            onTileClick(x, y, moveCost);
        } else {
            console.log(`Cannot move to (${x}, ${y}), out of range`);
        }
    };

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

    // Determine the boundaries for rendering the map around the player
    const renderStartX = Math.max(0, currentPosition.x - 3); // Adjust based on the player's position
    const renderEndX = Math.min(map[0].length - 1, currentPosition.x + 3);
    const renderStartY = Math.max(0, currentPosition.y - 3);
    const renderEndY = Math.min(map.length - 1, currentPosition.y + 3);

    return (
        <div className={styles.mapContainer}>
            {map.slice(renderStartY, renderEndY + 1).map((row, rowIndex) => (
                <div key={rowIndex} className={styles.mapRow}>
                    {row.slice(renderStartX, renderEndX + 1).map((tile, columnIndex) => (
                        <div
                            key={`${renderStartY + rowIndex}-${renderStartX + columnIndex}`}
                            className={`${styles.mapTile} ${styles[tile]} ${isOutOfRange(renderStartX + columnIndex, renderStartY + rowIndex) ? styles[`out-of-range-${tile}`] : ''}`}
                            onClick={() => handleClick(renderStartX + columnIndex, renderStartY + rowIndex)}
                        >
                            {getTileSymbol(tile)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MapComponent;