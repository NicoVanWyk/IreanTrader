import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainGame from '../screens/MainGame';

const AppRouter: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<MainGame />} />
        </Routes>
    );
};

export default AppRouter;