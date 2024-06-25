import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent';
import FullMapComponent from '../components/FullMapComponent';
import TextBox from '../components/TextBox';
import { initialMap } from '../data/mapData';
import styles from './css/MainGame.module.css';
import { getCurrentDate, MonthNames } from '../data/calendar';
import { generateStocks, CityCoordinate, Stock, StockItem } from '../data/stocks';
import TradeInterface from '../components/TradeInterfaceComponent';

const MainGame: React.FC = () => {
    const [playerData, setPlayerData] = useState<any>(null);
    const [movePoints, setMovePoints] = useState<number>(1);
    const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [days, setDays] = useState<number>(0);
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [showEnterCityButton, setShowEnterCityButton] = useState<boolean>(false);
    const [showTradeInterface, setShowTradeInterface] = useState<boolean>(false);
    const [showFullMap, setShowFullMap] = useState<boolean>(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [currentStocks, setCurrentStocks] = useState<Stock[][]>([]);
    const [citiesCoordinates, setCitiesCoordinates] = useState<CityCoordinate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [playerInventory, setPlayerInventory] = useState<StockItem[]>([]);
    const [currentCityStock, setCurrentCityStock] = useState<StockItem[]>([]);
    const [playerGold, setPlayerGold] = useState<number>(0);

    useEffect(() => {
        const savedPlayerData = localStorage.getItem('playerData');
        if (savedPlayerData) {
            const parsedPlayerData = JSON.parse(savedPlayerData);
            setPlayerData(parsedPlayerData);
            setPlayerGold(parsedPlayerData.playerGold)

            const endurance = parsedPlayerData?.stats?.Endurance;
            if (endurance) {
                const calculatedMovePoints = Math.ceil(endurance / 2);
                setMovePoints(calculatedMovePoints);
            }
        }
    }, []);

    useEffect(() => {
        const initializeGame = async () => {
            const initialPosition = findInitialPosition(initialMap);
            setCurrentPosition(initialPosition);

            // Get all of the cities and generate their stocks
            const citiesCoords = findAllCities(initialMap);
            setCitiesCoordinates(citiesCoords);

            const generatedStocks = await new Promise<Stock[][]>((resolve) => {
                const stocks = generateStocks(citiesCoords);
                resolve(stocks);
            });
            setCurrentStocks(generatedStocks);

            console.log(citiesCoords);
            console.log(generatedStocks);

            checkCityTile(initialPosition.x, initialPosition.y);
            setLoading(false);
        };

        initializeGame();
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

    const findAllCities = (map: string[][]): CityCoordinate[] => {
        let arrCoords: CityCoordinate[] = [];

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 'city') {
                    arrCoords.push({ x, y });
                }
            }
        }

        return arrCoords;
    };

    const checkCityTile = (x: number, y: number) => {
        const tile = initialMap[y][x];
        setShowEnterCityButton(tile === 'city');
    };

    const handleTileClick = (x: number, y: number, moveCost: number) => {
        console.log(`Clicked tile at (${x}, ${y})`);
        if (moveCost <= movePoints) {
            console.log(`Moving player to (${x}, ${y}) with move cost ${moveCost}`);
            setCurrentPosition({ x, y });
            setMovePoints(prevMovePoints => prevMovePoints - moveCost);
            addMessage(`Moved to (${x}, ${y}) with move cost ${moveCost}`);
        } else {
            console.log(`Cannot move to (${x}, ${y}), insufficient move points`);
            addMessage(`Cannot move to (${x}, ${y}), insufficient move points`);
        }
    };

    const handleEnterCity = () => {
        if (loading) {
            addMessage('Please wait, loading city stock...');
            return;
        }

        const cityIndex = citiesCoordinates.findIndex(city => city.x === currentPosition.x && city.y === currentPosition.y);

        if (cityIndex !== -1) {
            const cityStock = currentStocks[cityIndex];
            const stockItems: StockItem[] = cityStock.map(({ id, description, type, price, amountAvailable }) => ({
                id,
                description,
                type,
                price,
                amountAvailable,
            }));
            setCurrentCityStock(stockItems);
            setShowTradeInterface(true)
            console.log(`City Stock:`, stockItems);
        } else {
            addMessage('No city stock found.');
        }
    };

    const handleExitCity = () => {
        setShowTradeInterface(false)
    }

    const handlePurchase = (item: StockItem, amount: number) => {
        if (playerGold >= item.price * amount) {
            setPlayerGold(prevGold => prevGold - item.price * amount);
            setPlayerInventory(prevInventory => {
                const itemIndex = prevInventory.findIndex(invItem => invItem.id === item.id);
                if (itemIndex !== -1) {
                    const newInventory = [...prevInventory];
                    newInventory[itemIndex].amountAvailable += amount;
                    return newInventory;
                } else {
                    return [...prevInventory, { ...item, amountAvailable: amount }];
                }
            });
            addMessage(`Purchased ${amount} ${item.id}(s).`);
        } else {
            addMessage(`Not enough gold to purchase ${amount} ${item.id}(s).`);
        }
    };

    const handleSell = (item: StockItem, amount: number) => {
        const inventoryItem = playerInventory.find(invItem => invItem.id === item.id);
        if (inventoryItem && inventoryItem.amountAvailable >= amount) {
            setPlayerGold(prevGold => prevGold + item.price * amount);
            setPlayerInventory(prevInventory => {
                const newInventory = prevInventory.map(invItem =>
                    invItem.id === item.id ? { ...invItem, amountAvailable: invItem.amountAvailable - amount } : invItem
                );
                return newInventory.filter(invItem => invItem.amountAvailable > 0);
            });
            addMessage(`Sold ${amount} ${item.id}(s).`);
        } else {
            addMessage(`Not enough ${item.id}(s) to sell.`);
        }
    };

    const handleEndDayClick = () => {
        console.log('Ending the day...');
        handleRandomEvent();
        setDays(prevDays => prevDays + 1);
        setDayOfMonth(prevDay => (prevDay % 25) + 1);
        resetMovePoints();
        addMessage('Day ended.');

        // Check if the dayOfMonth resets to 1 (end of month)
        if (dayOfMonth % 25 === 0) {
            regenerateStocks();
        }
    };

    const regenerateStocks = () => {
        const regeneratedStocks = generateStocks(citiesCoordinates);
        setCurrentStocks(regeneratedStocks);
        addMessage('Stocks have been regenerated for each city.');
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
            playerInventory: playerInventory,
            playerGold: playerGold
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
            setPlayerInventory(parsedData.playerInventory);
            setPlayerGold(parsedData.playerGold);
            console.log(savedData);
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
            {showTradeInterface &&
                <div className={styles.TradeMenu}>
                    <TradeInterface
                        stock={currentCityStock}
                        playerInventory={playerInventory}
                        playerGold={playerGold}
                        onPurchase={handlePurchase}
                        onSell={handleSell}
                    />
                    <button className={styles.TradeExit} onClick={handleExitCity}>Exit City</button>
                    <div style={{ height: '50px' }}>
                        <p style={{ color: 'rgba(0, 0, 0, 0)' }}>spacer</p>
                    </div>
                </div>
            }
            <div className={styles.centeredContent}>
                {showFullMap ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <FullMapComponent map={initialMap} currentPosition={currentPosition} />
                        <button style={{ marginTop: '25px' }} onClick={toggleFullMap}>Close Map</button>
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
                                {showEnterCityButton && <button onClick={handleEnterCity} disabled={showTradeInterface}>Enter City</button>}
                                <button onClick={handleEndDayClick} disabled={showTradeInterface}>End Day</button>
                                <button onClick={handleSave} disabled={showTradeInterface}>Save</button>
                                <button onClick={handleLoad} disabled={showTradeInterface}>Load</button>
                                <button onClick={toggleFullMap} disabled={showTradeInterface}>Map</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainGame;