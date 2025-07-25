import React from 'react'
import UserProvider from './context/UserContext';
import { Toaster } from 'react-hot-toast'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Dashboard/Home';
import Income from './pages/Dashboard/Income';
import Expense from './pages/Dashboard/Expense';

const App = () => {
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
            <Route path='/' element={<Root />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signUp' element={<SignUp />} />
            <Route path='/dashboard' element={<Home />} />
            <Route path='/income' element={<Income />} />
            <Route path='/expense' element={<Expense />} />

          </Routes>
        </Router>
      </div>

      <Toaster
        toastOptions={{
          className: "", 
          style: {
            fontSize: '13px'
          },
        }}
      />
    </UserProvider>
  )
}

export default App

const Root = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? (<Navigate to="/dashboard" />) : (<Navigate to="/login" />);
}
