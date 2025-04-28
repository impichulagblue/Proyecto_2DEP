import React from 'react';
import { Outlet } from 'react-router-dom';
import Auth from '../Auth/Auth';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Auth />
      <div className="content-container">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;