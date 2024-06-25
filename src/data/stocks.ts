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
        const numberOfItems = getRandomInt(5, stockList.length);
        const selectedItems = [...stockList].sort(() => 0.5 - Math.random()).slice(0, numberOfItems);

        return selectedItems.map(item => ({
            ...item,
            price: getRandomInt(item.lowest_price, item.highest_price),
            amountAvailable: getRandomInt(1, 100)
        }));
    });
};

export { generateStocks };