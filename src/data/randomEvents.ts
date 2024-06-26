import randomEvents from './randomEvents.json'

export interface RandomEvent {
    description: string; // Message the user sees in a popup
    successOutcome: string; // Message to be added in the outcome
    failureOutcome: string; //^
    positiveEvent: boolean; //Is the event positive or negative
    resultAffects: string; // Indicates what the result will affect
    resultAmount: number; // Amount to add or subtract from inventory or gold
    solutions: {
        solutionText: string; // Text to display as a solution
        solutionStat: string; // Stat associated with the solution
        solutionDC: number; //DC of the solution
    }[];
}

// Function to generate a random event
const generateRandomEvent = (perception: number): RandomEvent | undefined => {
    // Determine if a random event happens
    const eventOccurs = Math.random() < 0.3; // 30% chance

    // Adjust chance of positive events based on perception
    const perceptionBonus = (0.01 * perception) * 2;

    // Default 50% chance of a positive event
    let adjustedPositiveChance = 0.5;

    if (eventOccurs) {
        adjustedPositiveChance += perceptionBonus;

        // Separate events into positive and negative categories
        const positiveEvents = randomEvents.filter(event => event.positiveEvent);
        const negativeEvents = randomEvents.filter(event => !event.positiveEvent);

        // Determine if a positive or negative event occurs based on adjusted chance
        if (Math.random() < adjustedPositiveChance && positiveEvents.length > 0) {
            const randomIndex = Math.floor(Math.random() * positiveEvents.length);
            return positiveEvents[randomIndex];
        } else if (negativeEvents.length > 0) {
            const randomIndex = Math.floor(Math.random() * negativeEvents.length);
            return negativeEvents[randomIndex];
        }
    } else {
        return undefined;
    }

};

export { generateRandomEvent };