import React, { useEffect, useState } from 'react';
import './styles.css';
import AppRouter from './components/AppRouter';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CharacterCreation from './screens/CharacterCreation';

const App: React.FC = () => {
  const [localStorageEmpty, setLocalStorageEmpty] = useState(false);

  useEffect(() => {
    const isLocalStorageEmpty = !localStorage.getItem('playerData');
    setLocalStorageEmpty(isLocalStorageEmpty);
  }, []);

  return (
    <Router basename="/IreanTrader">
      <div className="App">
        <Routes>
          <Route path="/" element={localStorageEmpty ? <Navigate to="/character-creation" /> : <AppRouter />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;