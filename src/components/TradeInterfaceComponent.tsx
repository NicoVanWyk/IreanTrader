import React, { useState } from 'react';
import styles from './css/TradeInterfaceComponent.module.css';
import { StockItem } from '../data/stocks';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

interface TradeInterfaceProps {
    stock: StockItem[];
    playerInventory: StockItem[];
    playerGold: number;
    onPurchase: (item: StockItem, amount: number) => void;
    onSell: (item: StockItem, amount: number) => void;
}

const TradeInterface: React.FC<TradeInterfaceProps> = ({ stock, playerInventory, playerGold, onPurchase, onSell }) => {
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<StockItem | null>(null);
    const [purchaseAmount, setPurchaseAmount] = useState<number>(1);
    const [sellAmount, setSellAmount] = useState<number>(1);

    // Function to calculate discounted price based on Charm stat
    const calculateDiscountedPrice = (item: StockItem) => {
        const charm = 1; // Replace with actual Charm stat calculation
        const discountPercentage = Math.max(1, Math.floor(charm * 2));
        return Math.max(1, Math.floor(item.price * (1 - discountPercentage / 100)));
    };

    // Function to calculate marked-up price based on Cunning stat
    const calculateMarkedUpPrice = (item: StockItem) => {
        const cunning = 1; // Replace with actual Cunning stat calculation
        const markupPercentage = Math.ceil(cunning * 2);
        return Math.floor(item.price * (1 + markupPercentage / 100));
    };

    const handlePurchase = () => {
        if (selectedStock && purchaseAmount > 0) {
            onPurchase(selectedStock, purchaseAmount);
            setPurchaseAmount(1);
        }
    };

    const handleSell = () => {
        if (selectedInventoryItem && sellAmount > 0) {
            onSell(selectedInventoryItem, sellAmount);
            setSellAmount(1);
        }
    };

    return (
        <div className={styles.tradeInterface}>
            <Tabs>
                <TabList className={styles.tabList}>
                    <Tab className={styles.tabListItem}>Buy</Tab>
                    <Tab className={styles.tabListItem}>Sell</Tab>
                </TabList>

                <TabPanel className={styles.tabPanel}>
                    <div className={styles.stockContainer}>
                        <h2>City Stock</h2>
                        <div className={styles.stockGrid}>
                            {stock.map(item => (
                                <div key={item.id} className={styles.stockCard} onClick={() => setSelectedStock(item)}>
                                    <div className={styles.stockDetails}>
                                        <h4>{item.id}</h4>
                                        <p>{item.description}</p>
                                        <p>Price: {item.price} gold</p>
                                        <p>{item.amountAvailable} available</p>
                                    </div>
                                    {selectedStock === item && (
                                        <div className={styles.tradeControls}>
                                            <p>Discounted Price (Charm): <br></br> {calculateDiscountedPrice(item)} gold</p>
                                            <input
                                                type="number"
                                                value={purchaseAmount}
                                                onChange={e => setPurchaseAmount(parseInt(e.target.value))}
                                                min="1"
                                                max={selectedStock.amountAvailable}
                                            />
                                            <button onClick={handlePurchase}>Purchase</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={styles.summary}>
                            <h2>Your Gold: {playerGold} gold</h2>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel className={styles.tabPanel}>
                    <div className={styles.stockContainer}>
                        <h2>Player Inventory</h2>
                        <div className={styles.stockGrid}>
                            {playerInventory.map(item => (
                                <div key={item.id} className={styles.stockCard} onClick={() => setSelectedInventoryItem(item)}>
                                    <div className={styles.stockDetails}>
                                        <h4>{item.id}</h4>
                                        <p>{item.description}</p>
                                        <p>Price: {item.price} gold</p>
                                        <p>{item.amountAvailable} in inventory</p>
                                    </div>
                                    {selectedInventoryItem === item && (
                                        <div className={styles.tradeControls}>
                                            <p>Marked-Up Price (Cunning): <br></br> {calculateMarkedUpPrice(item)} gold</p>
                                            <input
                                                type="number"
                                                value={sellAmount}
                                                onChange={e => setSellAmount(parseInt(e.target.value))}
                                                min="1"
                                                max={selectedInventoryItem.amountAvailable}
                                            />
                                            <button onClick={handleSell}>Sell</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={styles.summary}>
                            <h2>Your Gold: {playerGold} gold</h2>
                        </div>
                    </div>
                </TabPanel>
            </Tabs>
        </div>
    );
};

export default TradeInterface;