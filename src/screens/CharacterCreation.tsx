import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import optionsData from '../data/options.json';
import styles from './css/CharacterCreation.module.css';

const CharacterCreation: React.FC = () => {
    const { races, genders, background, abilities, languages, alignment } = optionsData;

    // State to store selected race, gender, background, and stats
    const [selectedRace, setSelectedRace] = useState<keyof typeof races>('Human');
    const [selectedGender, setSelectedGender] = useState<string>('Female');
    const [selectedBackground, setSelectedBackground] = useState<keyof typeof background>('Acolyte');
    const [selectedName, setSelectedName] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('Standard');
    const [selectedAlignment, setSelectedAlignment] = useState<string>('Neutral');

    const [playerData, setPlayerData] = useState<any>(null);

    const [pointsAvailable, setPointsAvailable] = useState<number>(5);
    const [stats, setStats] = useState({
        Strength: 1,
        Charm: 1,
        Cunning: 1,
        Intelligence: 1,
        Dexterity: 1,
        Endurance: 1,
        Perception: 1,
        Luck: 1,
    });

    // Apply racial and background bonuses when race or background changes
    useEffect(() => {
        const applyBonuses = (race: keyof typeof races, bg: keyof typeof background) => {
            const updatedStats = { ...stats };

            // Apply race bonuses
            if (races[race]?.bonuses) {
                for (const ability of races[race].bonuses) {
                    updatedStats[ability as keyof typeof stats] += 1;
                }
            }

            // Apply background bonuses
            if (background[bg]?.bonuses) {
                for (const ability of background[bg].bonuses) {
                    updatedStats[ability as keyof typeof stats] += 1;
                }
            }

            setStats(updatedStats);
        };

        applyBonuses(selectedRace, selectedBackground);

        setPointsAvailable(5); // Reset points available when race or background changes
    }, [selectedRace, selectedBackground]);

    const handleRaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRace = event.target.value as keyof typeof races;
        setSelectedRace(selectedRace);
        resetStats();
    };

    const handleGenderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGender(event.target.value);
    };

    const handleBackgroundChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedBackground = event.target.value as keyof typeof background;
        setSelectedBackground(selectedBackground);
        resetStats();
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLanguage(event.target.value);
    };

    const handleAlignmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAlignment(event.target.value);
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedName(event.target.value);
    };

    const increaseStat = (stat: keyof typeof stats) => {
        if (pointsAvailable > 0 && stats[stat] < 5) {
            setStats((prevStats) => ({
                ...prevStats,
                [stat]: prevStats[stat] + 1,
            }));
            setPointsAvailable((prevPoints) => prevPoints - 1);
        }
    };

    const decreaseStat = (stat: keyof typeof stats) => {
        if (stats[stat] > 1) {
            setStats((prevStats) => ({
                ...prevStats,
                [stat]: prevStats[stat] - 1,
            }));
            setPointsAvailable((prevPoints) => prevPoints + 1);
        }
    };

    const resetStats = () => {
        setStats({
            Strength: 1,
            Charm: 1,
            Cunning: 1,
            Intelligence: 1,
            Dexterity: 1,
            Endurance: 1,
            Perception: 1,
            Luck: 1,
        });
        setPointsAvailable(5);
    };

    const handleFinish = () => {
        // Check if character name is not empty and points available are 0
        if (selectedName.trim() === '') {
            alert('Please enter a character name.');
            return;
        }

        if (pointsAvailable !== 0) {
            alert('Please allocate all available points before finishing.');
            return;
        }

        // Confirm finishing
        if (window.confirm('Are you sure you want to finish creating your character?')) {
            const data = {
                race: selectedRace,
                gender: selectedGender,
                background: selectedBackground,
                name: selectedName,
                language: selectedLanguage,
                alignment: selectedAlignment,
                stats: stats
            };

            setPlayerData(data); // Save player data object
            console.log('Player Data:', data);

            // Save to localStorage
            localStorage.setItem('playerData', JSON.stringify(data));
        }
    };

    return (
        <div className={styles.tabs}>
            <h1 style={{ textAlign: 'center' }}>Create Your Character</h1>

            <Tabs>
                <TabList className={styles.tabList}>
                    <Tab className={styles.tabListItem}>Character Details</Tab>
                    <Tab className={styles.tabListItem}>Adjust Ability Scores</Tab>
                    <Tab className={styles.tabListItem}>Finish</Tab>
                </TabList>

                <TabPanel className={styles.tabPanel}>
                    {/* Character Details Tab */}
                    <div>
                        {/* Display selected race, gender, and background details */}
                        <div className={styles.selectContainer}>
                            <div>
                                <label>Select Race:</label>
                                <select value={selectedRace} onChange={handleRaceChange} aria-label="Select Race">
                                    {Object.keys(races).map((raceName: string) => (
                                        <option key={raceName} value={raceName}>{raceName}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedRace && <p>Description: {races[selectedRace]?.description}</p>}

                            <div>
                                <label>Select Background:</label>
                                <select value={selectedBackground} onChange={handleBackgroundChange} aria-label="Select Background">
                                    {Object.keys(background).map((bgName: string) => (
                                        <option key={bgName} value={bgName}>{bgName}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedBackground && <p>Description: {background[selectedBackground]?.description}</p>}

                            <div>
                                <label>Select Gender:</label>
                                <select value={selectedGender} onChange={handleGenderChange} aria-label="Select Gender">
                                    {genders.map((gender: any) => (
                                        <option key={gender.id} value={gender.name}>{gender.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel className={styles.tabPanel}>
                    {/* Adjust Ability Scores Tab */}
                    <div className={styles.abilityContainer}>
                        <h3>Stat Distribution (Points Available: {pointsAvailable})</h3>
                        <div className={styles.abilityGrid}>
                            {Object.keys(stats).map((statKey) => (
                                <div key={statKey as keyof typeof stats} className={styles.abilityCard}>
                                    <h4>{statKey}</h4>
                                    <p>{abilities[statKey as keyof typeof stats]}</p>
                                    <div className={styles.abilityControls}>
                                        <button className={styles.minusButton} onClick={() => decreaseStat(statKey as keyof typeof stats)}>-</button>
                                        <span className='statAmount'>{stats[statKey as keyof typeof stats]}</span>
                                        <button className={styles.plusButton} onClick={() => increaseStat(statKey as keyof typeof stats)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabPanel>

                <TabPanel className={styles.tabPanel}>
                    {/* Additional Character Details */}
                    <div className={styles.characterDetails}>
                        <div>
                            <label>Name:</label>
                            <input
                                type="text"
                                value={selectedName}
                                onChange={handleNameChange}
                                placeholder="Enter character name"
                            />
                        </div>

                        <div>
                            <label>Select Second Language:</label>
                            <select value={selectedLanguage} onChange={handleLanguageChange} aria-label="Select Language">
                                {languages.map((lang, index) => (
                                    <option key={index} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Select Alignment:</label>
                            <select value={selectedAlignment} onChange={handleAlignmentChange} aria-label="Select Alignment">
                                {alignment.map((align, index) => (
                                    <option key={index} value={align}>{align}</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleFinish}>Finish</button>
                    </div>
                </TabPanel>
            </Tabs>
        </div>
    );
};

export default CharacterCreation;