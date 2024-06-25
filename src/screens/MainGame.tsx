// MainGame.tsx
import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent';
import FullMapComponent from '../components/FullMapComponent';
import TextBox from '../components/TextBox';
import { initialMap } from '../data/mapData';
import styles from './css/MainGame.module.css';
import { getCurrentDate, MonthNames } from '../data/calendar';

const MainGame: React.FC = () => {
    const [playerData, setPlayerData] = useState<any>(null);
    const [movePoints, setMovePoints] = useState<number>(1);
    const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [days, setDays] = useState<number>(0);
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [showEnterCityButton, setShowEnterCityButton] = useState<boolean>(false);
    const [showFullMap, setShowFullMap] = useState<boolean>(false); // State for showing full map
    const [messages, setMessages] = useState<string[]>([]); // State for storing messages

    useEffect(() => {
        const savedPlayerData = localStorage.getItem('playerData');
        if (savedPlayerData) {
            const parsedPlayerData = JSON.parse(savedPlayerData);
            setPlayerData(parsedPlayerData);

            const endurance = parsedPlayerData?.stats?.Endurance;
            if (endurance) {
                const calculatedMovePoints = Math.ceil(endurance / 2);
                setMovePoints(calculatedMovePoints);
            }
        }
    }, []);

    useEffect(() => {
        const initialPosition = findInitialPosition(initialMap);
        setCurrentPosition(initialPosition);
        checkCityTile(initialPosition.x, initialPosition.y);
    }, []);

    useEffect(() => {
        checkCityTile(currentPosition.x, currentPosition.y);
    }, [currentPosition]);

    const findInitialPosition = (map: string[][]): { x: number; y: number } => {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 'city') {
                    return { x, y };
                }
            }
        }
        return { x: 0, y: 0 };
    };

    const checkCityTile = (x: number, y: number) => {
        const tile = initialMap[y][x];
        setShowEnterCityButton(tile === 'city');
    };

    const handleTileClick = (x: number, y: number, moveCost: number) => {
        console.log(`Clicked tile at (${x}, ${y})`);
        const distance = Math.max(Math.abs(currentPosition.x - x), Math.abs(currentPosition.y - y));
        if (distance <= movePoints) {
            console.log(`Moving player to (${x}, ${y})`);
            setCurrentPosition({ x, y });
            setMovePoints(prevMovePoints => prevMovePoints - moveCost);
            addMessage(`Moved to (${x}, ${y})`);
        } else {
            console.log(`Cannot move to (${x}, ${y}), out of range`);
            addMessage(`Cannot move to (${x}, ${y}), out of range`);
        }
    };

    const handleEnterCity = () => {
        console.log('Entering the city...');
        addMessage('Entered the city.');
    };

    const handleEndDayClick = () => {
        console.log('Ending the day...');
        handleRandomEvent();
        setDays(prevDays => prevDays + 1);
        setDayOfMonth(prevDay => (prevDay % 25) + 1);
        resetMovePoints();
        addMessage('Day ended.');
    };

    const handleRandomEvent = () => {
        console.log('Handling random event...');
        addMessage('Handled random event.');
    };

    const resetMovePoints = () => {
        const endurance = playerData?.stats?.Endurance;
        if (endurance) {
            const calculatedMovePoints = Math.ceil(endurance / 2);
            setMovePoints(calculatedMovePoints);
        }
    };

    const handleSave = () => {
        const dataToSave = {
            playerData: playerData,
            currentPosition: currentPosition,
            days: days,
            dayOfMonth: dayOfMonth,
            movePoints: movePoints,
        };

        localStorage.setItem('gameData', JSON.stringify(dataToSave));
        console.log('Game data saved to localStorage.');
        addMessage('Game saved.');
    };

    const handleLoad = () => {
        const savedData = localStorage.getItem('gameData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setPlayerData(parsedData.playerData);
            setCurrentPosition(parsedData.currentPosition);
            setDays(parsedData.days);
            setDayOfMonth(parsedData.dayOfMonth);
            setMovePoints(parsedData.movePoints);
            console.log('Game data loaded from localStorage.');
            addMessage('Game loaded.');
        } else {
            console.log('No saved game data found.');
            addMessage('No saved game data found.');
        }
    };

    const getCurrentDateString = (): string => {
        const currentDate = getCurrentDate(days);
        const monthIndex = currentDate.getMonth();
        const day = dayOfMonth;
        const year = currentDate.getFullYear();

        return `${day} ${MonthNames[monthIndex]}, ${year}`;
    };

    const toggleFullMap = () => {
        setShowFullMap(prev => !prev); // Toggle full map state
    };

    const addMessage = (message: string) => {
        setMessages(prevMessages => [...prevMessages, message]);
    };

    return (
        <div className={styles.mainGameContainer}>
            <div className={styles.centeredContent}>
                {showFullMap ? (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <FullMapComponent map={initialMap} currentPosition={currentPosition} />
                        <button style={{marginTop: '25px'}} onClick={toggleFullMap}>Close Map</button>
                    </div>
                ) : (
                    <div>
                        <MapComponent
                            map={initialMap}
                            currentPosition={currentPosition}
                            movePoints={movePoints}
                            onTileClick={handleTileClick}
                        />
                        <div className={styles.buttonContainer}>
                            <div className={styles.textBox}>
                                <TextBox messages={messages} />
                            </div>
                            <div className={styles.buttonGroup}>
                                <p>Move Points: {movePoints}</p>
                                <p>Current Date: {getCurrentDateString()}</p>
                                {showEnterCityButton && <button onClick={handleEnterCity}>Enter City</button>}
                                <button onClick={handleEndDayClick}>End Day</button>
                                <button onClick={handleSave}>Save</button>
                                <button onClick={handleLoad}>Load</button>
                                <button onClick={toggleFullMap}>Map</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainGame;