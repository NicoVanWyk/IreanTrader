// calendar.ts

const DAYS_IN_WEEK = 5;
const WEEKS_IN_MONTH = 5;
const DAYS_IN_MONTH = WEEKS_IN_MONTH * DAYS_IN_WEEK;
const MONTHS_IN_SEASON = 4;
const DAYS_IN_SEASON = MONTHS_IN_SEASON * DAYS_IN_MONTH;
const SEASONS_IN_YEAR = 4;
const DAYS_IN_YEAR = SEASONS_IN_YEAR * DAYS_IN_SEASON;

const MonthNames = [
    "Winter's Start",
    "Celynrag",
    "Talan",
    "Winter's End",
    "Spring's Start",
    "Ynsovan",
    "Grothlynan",
    "Spring's End",
    "Summer's Start",
    "Jalynsong",
    "Bandari",
    "Summer's End",
    "Autumn's Start",
    "Celindro",
    "Alynon",
    "Autumn's End",
] as const;

// Function to calculate the current date based on days passed
const getCurrentDate = (daysPassed: number): Date => {
    const totalDays = daysPassed % DAYS_IN_YEAR;
    const seasonIndex = Math.floor(totalDays / DAYS_IN_SEASON);
    const daysInSeason = totalDays % DAYS_IN_SEASON;
    const monthIndex = Math.floor(daysInSeason / DAYS_IN_MONTH);
    const dayIndex = (daysInSeason % DAYS_IN_MONTH) % DAYS_IN_WEEK + 1;

    const currentDate = new Date();
    currentDate.setFullYear(1690);
    currentDate.setMonth(monthIndex);
    currentDate.setDate(dayIndex);

    return currentDate;
};

export { MonthNames, getCurrentDate };