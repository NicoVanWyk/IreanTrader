import React, { useEffect, useState } from 'react';
import './styles.css';
import AppRouter from './components/AppRouter';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CharacterCreation from './screens/CharacterCreation';
import { useLocalStorageListener } from './hooks/useLocalStorageListener';

const App: React.FC = () => {
  // Initialize state with a function to synchronously check localStorage during initial render
  const [localStorageEmpty, setLocalStorageEmpty] = useState<boolean>(() => {
    const playerData = localStorage.getItem('playerData');
    console.log('Initial check - playerData:', playerData); // Debugging log
    return !playerData;
  });

  const checkLocalStorage = () => {
    const playerData = localStorage.getItem('playerData');
    console.log('checkLocalStorage - playerData:', playerData); // Debugging log
    setLocalStorageEmpty(!playerData);
  };

  useEffect(() => {
    checkLocalStorage();
  }, []);

  useLocalStorageListener(checkLocalStorage);

  useEffect(() => {
    console.log('localStorageEmpty state updated:', localStorageEmpty); // Debugging log
  }, [localStorageEmpty]);

  return (
    <Router basename="/IreanTrader">
      <div className="App">
        <Routes>
          <Route path="/" element={!localStorageEmpty ? <AppRouter /> : <Navigate to="/character-creation" />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;