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
import { RandomEvent, generateRandomEvent } from '../data/randomEvents';

const MainGame: React.FC = () => {
    const navigate = useNavigate();

    // Player data
    const [playerData, setPlayerData] = useState<any>(null);
    const [playerInventory, setPlayerInventory] = useState<StockItem[]>([]);
    const [playerGold, setPlayerGold] = useState<number>(0);

    // Movement Data
    const [movePoints, setMovePoints] = useState<number>(1);
    const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // World Data
    const [days, setDays] = useState<number>(0);
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [currentStocks, setCurrentStocks] = useState<Stock[][]>([]);
    const [citiesCoordinates, setCitiesCoordinates] = useState<CityCoordinate[]>([]);

    // Component state variables
    const [showEnterCityButton, setShowEnterCityButton] = useState<boolean>(false);
    const [showTradeInterface, setShowTradeInterface] = useState<boolean>(false);
    const [showFullMap, setShowFullMap] = useState<boolean>(false);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showCharacter, setShowCharacter] = useState<boolean>(false);
    const [showRandomEventMenu, setShowRandomEventMenu] = useState<boolean>(false);
    const [disableControls, setDisableControls] = useState<boolean>(false);

    // Output variables
    const [messages, setMessages] = useState<string[]>([]);

    // Trade Variables
    const [currentCityStock, setCurrentCityStock] = useState<StockItem[]>([]);

    // Random event data
    const [randomEventData, setRandomEventData] = useState<RandomEvent>();

    // Initialise player data
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

    // Initialise game data
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
        };

        initializeGame();
    }, []);

    // Check the tile the user moves to, and see if it is a city tile or not
    useEffect(() => {
        checkCityTile(currentPosition.x, currentPosition.y);
    }, [currentPosition]);

    const checkCityTile = (x: number, y: number) => {
        const tile = initialMap[y][x];
        setShowEnterCityButton(tile === 'city');
    };

    // Find the user's starting position
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

    // Generate a list of all the cities in the map.
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

    // Handle movement across tiles
    const handleTileClick = (x: number, y: number, moveCost: number) => {
        console.log(`Clicked tile at (${x}, ${y})`);
        if (moveCost == 0 && movePoints > 0) {
            addMessage(`You are already here.`);
        } else if (moveCost <= movePoints && movePoints != 0) {
            console.log(`Moving player to (${x}, ${y}) with move cost ${moveCost}`);
            setCurrentPosition({ x, y });
            setMovePoints(prevMovePoints => prevMovePoints - moveCost);
        } else {
            if (x === currentPosition.x && y === currentPosition.y) {
                handleEndDayClick();
            } else {
                addMessage(`You are too tired to move to (${x}, ${y})`);
            }
        }
    };

    // Handle showing the trade interface, as well as find the stock for the city that was entered
    const handleEnterCity = () => {
        setDisableControls(true);

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

    // Hide the trade interface and enable controls
    const handleExitCity = () => {
        setShowTradeInterface(false);
        setDisableControls(false);
    }

    // Purchase an item
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

    // Sell an item
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

    // End the day, trigger a random event and reset move points
    const handleEndDayClick = () => {
        console.log('Ending the day...');
        handleRandomEvent();
        setDays(prevDays => prevDays + 1);
        setDayOfMonth(prevDay => (prevDay % 25) + 1);
        resetMovePoints();

        // Check if the dayOfMonth resets to 1 (end of month)
        if (dayOfMonth % 25 === 0) {
            regenerateStocks();
        }
    };

    // Regenerate stocks for all cities
    const regenerateStocks = () => {
        const regeneratedStocks = generateStocks(citiesCoordinates);
        setCurrentStocks(regeneratedStocks);
        addMessage('Stocks have refreshed in each city.');
    };

    // Generate a random event and show the menu
    const handleRandomEvent = () => {
        // Generate a random event
        const event: RandomEvent | undefined = generateRandomEvent(playerData.stats.perception);

        if (event) {
            setRandomEventData(event)
            setShowRandomEventMenu(true);
            setDisableControls(true)
        } else {
            console.log('No random event occurred.');
        }
    };

    // Click a solution on the random event that was generated
    const handleSolutionClick = (solutionStat: string, solutionDC: number) => {
        const { stats } = playerData;
        const typeAffects = randomEventData?.resultAffects;
        const affectsAmount = randomEventData?.resultAmount;

        if (stats && typeof stats === 'object' && solutionStat in stats) {
            const statAmount = stats[solutionStat];

            const d20Roll = Math.floor(Math.random() * 20) + 1;
            const rollWithModifier = d20Roll + statAmount;

            if (rollWithModifier >= solutionDC) {
                // Handle success outcome
                applyOutcome(typeAffects, affectsAmount);
            } else {
                // Handle failure outcome
                applyOutcome(typeAffects, -affectsAmount!);
            }
        } else {
            console.log(`Player does not have stat ${solutionStat}`);
        }
    };

    // Apply the outcome of the random event depending on what happened
    const applyOutcome = async (typeAffects: string | undefined, amount: number | undefined) => {
        if (typeAffects && amount !== undefined) {

            if (playerInventory) {
                // if the outcome was negative. This is done so this is not applied to positive outcomes, as the player will get something anyways
                if (amount < 0) {
                    console.log('failure')
                    // If the user has no gold nor inventory
                    if (playerGold === 0 && playerInventory.length === 0) {
                        setPlayerGold(10);
                        addMessage('The fates seem to smile on you: last night you had nothing left to lose, but you find 10 gold just outside your camp as you begin your new day.');
                        setShowRandomEventMenu(false);
                        setDisableControls(false);

                        return;

                        // If gold is targeted, but the player has no gold left, but they do have inventory (ensure by the first if statement checking to see if both are empty)
                    } else if (typeAffects === 'Gold' && playerGold === 0) {
                        // --rather target inventory
                        affectInventory(amount);
                        setShowRandomEventMenu(false);
                        setDisableControls(false);

                        return;

                        // If inventory is targeted, but the player has no inventory
                    } else if (typeAffects === 'Inventory' && playerInventory.length === 0) {
                        // --rather target gold
                        affectGold(amount);
                        setShowRandomEventMenu(false);
                        setDisableControls(false);

                        return;
                    } else {
                        console.log(`Unknown resultAffects type: ${typeAffects}`);
                    }
                }

                // Doesn't need a check as it checks the failure/success in the function. The check above is ONLY when the user doesn't have enough 
                // of the affected type to subtract, and must therefore subtract a different type. (or if they have nothing at all)
                // If the user has enough gold
                if (typeAffects === 'Gold' && playerGold > 0) {
                    affectGold(amount);
                    setShowRandomEventMenu(false);
                    setDisableControls(false);

                    return;
                } else if (typeAffects === 'Inventory' && playerInventory.length > 0) {
                    affectInventory(amount);
                    setShowRandomEventMenu(false);
                    setDisableControls(false);

                    return;
                } else {
                    console.log(`Unknown resultAffects type: ${typeAffects}`);
                }

            } else {
                console.log(`Invalid typeAffects or amount: ${typeAffects}, ${amount}`);
            }
        }
    };

    // --Change the gold amount
    const affectGold = (amount: number) => {
        const newGold = playerGold + amount;

        if (newGold >= 0) {
            setPlayerGold(newGold);

            if (amount > 0) {
                addMessage(randomEventData!.successOutcome);
                addMessage('You gain ' + amount + ' gold.');
            } else if (amount < 0) {
                let displayAmount = amount * -1;
                addMessage(randomEventData!.failureOutcome);
                addMessage('You lose ' + displayAmount + ' gold.');
            }

        } else {
            setPlayerData({ ...playerData, playerGold: 0 });
            addMessage('All of your gold has been lost...');
        }
    };

    // --Change a random inventory item's amount amount
    const affectInventory = (amount: number) => {
        const inventory = playerInventory;

        // Randomly select an item index
        const randomIndex = Math.floor(Math.random() * inventory.length);
        const selectedItem = inventory[randomIndex];

        // Update item amount
        const updatedAmount = selectedItem.amountAvailable + amount;

        // If the amount is less than 0, it can be assumed that it was a failure.
        if (updatedAmount <= 0) {
            // Remove item from inventory
            inventory.splice(randomIndex, 1);
            addMessage(randomEventData!.failureOutcome);
            addMessage('You have lost all your stock of ' + selectedItem.id + ".");
        } else {
            // Update item amount
            selectedItem.amountAvailable = updatedAmount;
            inventory[randomIndex] = selectedItem;

            // if it was a success
            if (amount > 0) {
                addMessage(randomEventData!.successOutcome);
                addMessage('You gain ' + amount + ' stock of ' + selectedItem.id + '.');

                // if it was a failure
            } else if (amount < 0) {
                addMessage(randomEventData!.failureOutcome);
                let displayAmount = amount * -1;
                addMessage('You lose ' + displayAmount + ' stock of ' + selectedItem.id + '.');
            }
        }

        // Update playerData with new inventory
        setPlayerInventory(inventory);
    };

    // Reset move points after each day
    const resetMovePoints = () => {
        const endurance = playerData?.stats?.Endurance;
        if (endurance) {
            const calculatedMovePoints = Math.ceil(endurance / 2);
            setMovePoints(calculatedMovePoints);
        }
    };

    // Save all relevant data to localStorage
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

    // Load saved data
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

    // Restart the game, removing all items from localStorage
    const handleRestart = () => {
        // Confirm finishing
        if (window.confirm('Are you sure you want to restart? You will lose all of your progress.')) {
            localStorage.clear();

            navigate('/character-creation');
        }
    }

    // Get the current date as a string
    const getCurrentDateString = (): string => {
        const currentDate = getCurrentDate(days);
        const monthIndex = currentDate.getMonth();
        const day = dayOfMonth;
        const year = currentDate.getFullYear();

        return `${day} ${MonthNames[monthIndex]}, ${year}`;
    };

    // Toggle showing/hiding the map
    const toggleFullMap = () => {
        setShowFullMap(prev => !prev);
    };

    // Add a message to the text box
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
                    <button className={styles.menuButton} onClick={() => (setShowMenu(false), setDisableControls(false))} disabled={showTradeInterface}>Close Menu</button>
                </div>
            ) : null}

            {showRandomEventMenu && randomEventData ? (
                <div className={styles.randomEventMenu}>
                    <h2>{randomEventData.description}</h2>
                    {/* Render solutions as clickable text lines */}
                    <ol>
                        {randomEventData.solutions.map((solution, index) => (
                            <li key={index} onClick={() => handleSolutionClick(solution.solutionStat, solution.solutionDC)}>
                                {solution.solutionText}
                            </li>
                        ))}
                    </ol>
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

                            <button className={styles.menuButton} onClick={() => (setShowCharacter(false), setDisableControls(false))} disabled={showTradeInterface}>
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
                            <button className={styles.menuButton} onClick={() => (setShowCharacter(false), setDisableControls(false))} disabled={showTradeInterface}>
                                Close Menu
                            </button>
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
                        ) : showMenu || showCharacter || showRandomEventMenu ? (
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
                                {showEnterCityButton && <button onClick={handleEnterCity} disabled={disableControls}>Enter City</button>}
                                <button onClick={handleEndDayClick} disabled={disableControls}>End Day</button>
                                <button onClick={() => (setShowCharacter(true), setDisableControls(true))} disabled={disableControls}>Character</button>
                                <button onClick={toggleFullMap} disabled={disableControls}>Map</button>
                                <button onClick={() => (setShowMenu(true), setDisableControls(true))} disabled={disableControls}>Menu</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainGame;