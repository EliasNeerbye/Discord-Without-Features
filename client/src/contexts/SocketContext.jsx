import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        withCredentials: true
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setConnected(false);
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]);

  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};