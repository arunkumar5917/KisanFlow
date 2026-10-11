import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface QueueUpdate {
  tokenNumber: string;
  position: number;
  nowServing: number;
  estimatedWaitMin: number;
  status: string;
  plainStatus: Record<string, string>;
}

interface QueueContextType {
  updates: Map<string, QueueUpdate>;
  subscribe: (tokenNumber: string) => void;
  unsubscribe: (tokenNumber: string) => void;
  getUpdate: (tokenNumber: string) => QueueUpdate | undefined;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [updates, setUpdates] = useState<Map<string, QueueUpdate>>(new Map());
  const [ws, setWs] = useState<WebSocket | null>(null);

  const subscribe = useCallback((tokenNumber: string) => {
    // In a real app, this would connect to the WebSocket
    // For demo, we simulate updates
    console.log(`Subscribed to token: ${tokenNumber}`);
  }, []);

  const unsubscribe = useCallback((tokenNumber: string) => {
    console.log(`Unsubscribed from token: ${tokenNumber}`);
  }, []);

  const getUpdate = useCallback((tokenNumber: string) => {
    return updates.get(tokenNumber);
  }, [updates]);

  const mockUpdate = useCallback((tokenNumber: string) => {
    const positions = [10, 8, 5, 3, 2, 1, 0];
    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    const nowServing = Math.max(1, 15 - randomPos);
    
    setUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(tokenNumber, {
        tokenNumber,
        position: randomPos,
        nowServing,
        estimatedWaitMin: randomPos * 5,
        status: randomPos === 0 ? 'ARRIVED' : 'WAITING',
        plainStatus: {
          en: randomPos === 0 ? 'Arrived at Centre' : 'Waiting in Queue',
          hi: randomPos === 0 ? 'केंद्र पर पहुंचे' : 'कतार में प्रतीक्षा',
          pa: randomPos === 0 ? 'ਕੇਂਦਰ ਤੇ ਪਹੁੰਚੇ' : 'ਕਤਾਰ ਵਿੱਚ ਇੰਤਜ਼ਾਰ',
        },
      });
      return newMap;
    });
  }, []);

  return (
    <QueueContext.Provider
      value={{ updates, subscribe, unsubscribe, getUpdate }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}