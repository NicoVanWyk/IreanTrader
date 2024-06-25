import stockData from '../data/stock.json';

export interface StockData {
    id: string;
    description: string;
    type: string;
    lowest_price: number;
    highest_price: number;
}

export interface StockItem {
    id: string;
    description: string;
    type: string;
    price: number;
    amountAvailable: number;
}

export interface Stock extends StockData {
    price: number;
    amountAvailable: number;
}

export interface CityCoordinate {
    x: number;
    y: number;
}

const stockList: StockData[] = stockData;

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateStocks = (cityCoordinates: CityCoordinate[]): Stock[][] => {
    return cityCoordinates.map(() => {

        // Randomly select between 6 to 18 items
        const numberOfItems = getRandomInt(6, 18);

        // Sort stockList by rarity and randomly select items
        const selectedItems = [...stockList]
            // Sort by type to group similar items
            .sort((a, b) => a.type.localeCompare(b.type))
            // Assign a random rarity to each item, with a 30% chance to be rare and 70% chance to be common
            .map(item => ({
                ...item,
                rarity: getRandomInt(1, 10) <= 3 ? 'Rare' : 'Common' // Adjust for rarity
            }))
            // Include all food, but only include common adventuring goods and rare magical/exotic goods
            .filter(item => {
                switch (item.type) {
                    case 'Foodstuffs':
                    case 'Basic Goods':
                        return true;
                    case 'Adventuring Goods':
                    case 'Spiritual Goods':
                        return item.rarity === 'Common';
                    case 'Magical Goods':
                    case 'Exotic Goods':
                        return item.rarity === 'Rare';
                    default:
                        return true; // Default for other types
                }
            })
            .sort(() => 0.5 - Math.random()); // Randomize the order

        // Ensure at least one rare magical or exotic item is included
        let hasRareMagicalOrExoticItem = false;
        const finalItems = selectedItems.filter(item => {
            if ((item.type === 'Magical Goods' || item.type === 'Exotic Goods') && item.rarity === 'Rare' && !hasRareMagicalOrExoticItem) {
                hasRareMagicalOrExoticItem = true;
                return true;
            }
            return true;
        });

        // Ensure at least one rare item is included if not already included
        let hasRareItem = false;
        const itemsToReturn = finalItems.filter(item => {
            if (item.rarity === 'Rare' && !hasRareItem) {
                hasRareItem = true;
                return true;
            }
            return true;
        });

        // Select the number of items needed
        const selectedItemsToReturn = itemsToReturn.slice(0, Math.max(itemsToReturn.length, numberOfItems));

        // Generate stocks for selected items
        return selectedItemsToReturn.map(item => {
            // Calculate amountAvailable based on rarity
            let amountAvailable = getRandomInt(1, 100); // Default amount available

            switch (item.rarity) {
                case 'Rare':
                    amountAvailable = Math.ceil(amountAvailable * 0.1);
                    break;
                case 'Common':
                    amountAvailable = Math.ceil(amountAvailable * 0.5);
                    break;
                default:
                    break;
            }

            return {
                ...item,
                price: getRandomInt(item.lowest_price, item.highest_price),
                amountAvailable: Math.max(amountAvailable, 1) // Ensure at least one item available
            };
        });
    });
};

export { generateStocks };