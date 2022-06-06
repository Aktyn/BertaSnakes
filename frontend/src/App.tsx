import assert from 'assert'
import { memo, useEffect } from 'react'
import { io } from 'socket.io-client'
import logo from './logo.svg'

import './App.css'

function App() {
  useEffect(() => {
    assert(
      typeof process.env.REACT_APP_WEBSOCKET_URL === 'string',
      'REACT_APP_WEBSOCKET_URL is not set',
    )

    const socket = io(process.env.REACT_APP_WEBSOCKET_URL)
    socket.on('connect', function () {
      console.log('Connected')

      socket.emit('events', { test: 'test' })
      socket.emit('identity', 0, (response: number) =>
        console.log('Identity:', response),
      )
    })
    socket.on('events', function (data) {
      console.log('event', data)
    })
    socket.on('exception', function (data) {
      console.log('exception event', data)
    })
    socket.on('disconnect', function () {
      console.log('Disconnected')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

export default memo(App)
