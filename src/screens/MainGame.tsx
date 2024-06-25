import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent';
import FullMapComponent from '../components/FullMapComponent';
import TextBox from '../components/TextBox';
import { initialMap } from '../data/mapData';
import styles from './css/MainGame.module.css';
import { getCurrentDate, MonthNames } from '../data/calendar';
import { generateStocks, CityCoordinate, Stock, StockItem } from '../data/stocks';
import TradeInterface from '../components/TradeInterfaceComponent';
import { useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

const MainGame: React.FC = () => {
    const navigate = useNavigate();

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
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showCharacter, setShowCharacter] = useState<boolean>(false);

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
        if (moveCost == 0 && movePoints > 0) {
            addMessage(`You are already here.`);
        } else if (moveCost <= movePoints && movePoints != 0) {
            console.log(`Moving player to (${x}, ${y}) with move cost ${moveCost}`);
            setCurrentPosition({ x, y });
            setMovePoints(prevMovePoints => prevMovePoints - moveCost);
            addMessage(`Moved to (${x}, ${y}) with move cost ${moveCost}`);
        } else {
            if (x === currentPosition.x && y === currentPosition.y) {
                addMessage(`You decide to rest for the rest of the day at (${x}, ${y})`);
                handleEndDayClick();
            } else {
                addMessage(`You are too tired to move to (${x}, ${y})`);
            }
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

    // Inside handlePurchase function
    const handlePurchase = (item: StockItem, amount: number) => {
        // Calculate base purchase cost
        let purchaseCost = item.price * amount;

        // Calculate reduction based on Charm stat
        const charm = playerData?.stats?.Charm || 0;
        const charmReduction = Math.max(Math.floor(purchaseCost * 0.01 * 2 * charm), 1);
        purchaseCost -= charmReduction;

        // Check if the current city has the item in stock
        const cityItem = currentCityStock.find(cityItem => cityItem.id === item.id);
        if (!cityItem || cityItem.amountAvailable < amount) {
            addMessage(`Not enough ${item.id}(s) available to purchase.`);
            return;
        }

        if (playerGold >= purchaseCost) {
            setPlayerGold(prevGold => prevGold - purchaseCost);
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

            // Reduce city's stock
            setCurrentCityStock(prevCityStock => {
                const newCityStock = [...prevCityStock];
                const cityItemIndex = newCityStock.findIndex(cityItem => cityItem.id === item.id);
                if (cityItemIndex !== -1) {
                    newCityStock[cityItemIndex].amountAvailable -= amount / 2;
                }
                return newCityStock;
            });

            addMessage(`Purchased ${amount} ${item.id}(s).`);
        } else {
            addMessage(`Not enough gold to purchase ${amount} ${item.id}(s).`);
        }
    };

    // Inside handleSell function
    const handleSell = (item: StockItem, amount: number) => {
        const isItemInCityStock = currentCityStock.some(cityItem => cityItem.id === item.id);

        if (isItemInCityStock) {
            // Item exists in city's stock, cannot sell
            addMessage(`You cannot sell ${item.id}(s) here as it is already available for purchase.`);
            return;
        }

        // Calculate base sell price
        let sellPrice = item.price * amount;

        // Calculate increase based on Cunning stat
        const cunning = playerData?.stats?.Cunning || 0;
        const cunningIncrease = Math.ceil(sellPrice * 0.01 * 2 * cunning);
        sellPrice += cunningIncrease;

        const inventoryItem = playerInventory.find(invItem => invItem.id === item.id);
        if (inventoryItem && inventoryItem.amountAvailable >= amount) {
            setPlayerGold(prevGold => prevGold + sellPrice);
            setPlayerInventory(prevInventory => {
                const newInventory = prevInventory.map(invItem =>
                    invItem.id === item.id ? { ...invItem, amountAvailable: invItem.amountAvailable - amount } : invItem
                );
                return newInventory.filter(invItem => invItem.amountAvailable > 0);
            });
            addMessage(`Sold ${amount} ${item.id}(s) for ${sellPrice} gold.`);
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

    const handleRestart = () => {
        // Confirm finishing
        if (window.confirm('Are you sure you want to restart? You will lose all of your progress.')) {
            localStorage.clear();

            navigate('/character-creation');
        }
    }

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
                    <div style={{ height: '40px' }}>
                        <p style={{ color: 'rgba(0, 0, 0, 0)' }}>spacer</p>
                    </div>
                    <button className={styles.TradeExit} onClick={handleExitCity}>Exit City</button>
                    <TradeInterface
                        stock={currentCityStock}
                        playerInventory={playerInventory}
                        playerGold={playerGold}
                        onPurchase={handlePurchase}
                        onSell={handleSell}
                    />
                </div>
            }

            {showMenu ? (
                <div className={styles.Menu}>
                    <h1>Menu</h1>
                    <button className={styles.menuButton} onClick={handleSave} disabled={showTradeInterface}>Save</button>
                    <button className={styles.menuButton} onClick={handleLoad} disabled={showTradeInterface}>Load</button>
                    <button className={styles.menuButton} onClick={handleRestart} disabled={showTradeInterface}>Restart</button>
                    <button className={styles.menuButton} onClick={() => setShowMenu(false)} disabled={showTradeInterface}>Close Menu</button>
                </div>
            ) : null}

            {showCharacter ? (
                <Tabs className={styles.tabs}>
                    <TabList className={styles.tabList}>
                        <Tab className={styles.tabListItem}>Character</Tab>
                        <Tab className={styles.tabListItem}>Inventory</Tab>
                    </TabList>

                    <TabPanel className={styles.tabPanel}>
                        <div>
                            <h1>Character</h1>
                            <div style={{ display: 'flex' }}>
                                <p style={{ flex: '1' }}>Name: <b>{playerData.name}</b></p>
                                <p style={{ flex: '1' }}>Background: <b>{playerData.background}</b></p>
                                <p style={{ flex: '1' }}>Race: <b>{playerData.race}</b></p>
                            </div>

                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1' }}>
                                    {Object.keys(playerData.stats).slice(0, 4).map(statKey => (
                                        <p key={statKey}>{statKey}: {playerData.stats[statKey]}</p>
                                    ))}
                                </div>
                                <div style={{ flex: '1' }}>
                                    {Object.keys(playerData.stats).slice(4).map(statKey => (
                                        <p key={statKey}>{statKey}: {playerData.stats[statKey]}</p>
                                    ))}
                                </div>
                            </div>

                            <button className={styles.menuButton} onClick={() => setShowCharacter(false)} disabled={showTradeInterface}>
                                Close Menu
                            </button>
                        </div>
                    </TabPanel>
                    <TabPanel className={styles.tabPanel}>
                        <div>
                            <h2>Inventory</h2>
                            <ul>
                                {playerInventory.map(item => (
                                    <li key={item.id}>
                                        <b>{item.id}</b> - Price: {item.price} gold, Available: {item.amountAvailable}
                                    </li>
                                ))}
                            </ul>
                            <p>{playerGold} Gold</p>
                        </div>
                    </TabPanel>
                </Tabs>
            ) : null}

            <div className={styles.centeredContent}>
                {showFullMap ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <FullMapComponent map={initialMap} currentPosition={currentPosition} />
                        <button style={{ marginTop: '25px' }} onClick={toggleFullMap}>Close Map</button>
                    </div>
                ) : (
                    <div>
                        {showTradeInterface ? (
                            <h1>Welcome, {playerData.race}, please browse our wares.</h1>
                        ) : showMenu || showCharacter ? (
                            <h1>Game Has Been Paused</h1>
                        ) : <MapComponent
                            map={initialMap}
                            currentPosition={currentPosition}
                            movePoints={movePoints}
                            onTileClick={handleTileClick}
                        />}

                        <div className={styles.buttonContainer}>
                            <div className={styles.textBox}>
                                <TextBox messages={messages} />
                            </div>
                            <div className={styles.buttonGroup}>
                                <p>Move Points: {movePoints}</p>
                                <p>Current Date: {getCurrentDateString()}</p>
                                {showEnterCityButton && <button onClick={handleEnterCity} disabled={showTradeInterface || showMenu || showCharacter}>Enter City</button>}
                                <button onClick={handleEndDayClick} disabled={showTradeInterface || showMenu || showCharacter}>End Day</button>
                                <button onClick={() => setShowCharacter(true)} disabled={showTradeInterface || showMenu || showCharacter}>Character</button>
                                <button onClick={toggleFullMap} disabled={showTradeInterface || showMenu || showCharacter}>Map</button>
                                <button onClick={() => setShowMenu(true)} disabled={showTradeInterface || showMenu || showCharacter}>Menu</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainGame;