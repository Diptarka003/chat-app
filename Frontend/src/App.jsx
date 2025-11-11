import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage'
import ChatPage from './components/ChatPage'
import SignUp from './components/SignUp'
import Login from './components/Login'

function App() {

  return (
    <div>
      <Routes>
        <Route path='/HomePage' Component={HomePage}></Route>
        <Route path='/chat' Component={ChatPage}></Route>
        <Route path='/' Component={SignUp}></Route>
        <Route path='/Login' Component={Login}></Route>
        <Route path='/ChatPage/:conversationId' Component={ChatPage}></Route>
      </Routes>
    </div>
  )
}

export default App
