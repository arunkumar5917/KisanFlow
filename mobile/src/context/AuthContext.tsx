import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Role } from '../types';

interface FarmerProfile {
  id: string;
  mobile: string;
  name: string;
  aadhaar?: string;
  district?: string;
  village?: string;
  bankAccount?: string;
  ifscCode?: string;
  language: string;
}

interface AuthContextType {
  role: Role | null;
  farmer: FarmerProfile | null;
  centreId: string | null;
  token: string | null;
  setRole: (role: Role) => void;
  setFarmer: (farmer: FarmerProfile | null) => void;
  setCentreId: (centreId: string | null) => void;
  setToken: (token: string | null) => void;
  login: (role: Role, farmer?: FarmerProfile, centreId?: string, token?: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_FARMER: FarmerProfile = {
  id: 'demo-farmer-001',
  mobile: '+919876543210',
  name: 'Harpreet Singh',
  aadhaar: '123456789012',
  district: 'Karnal',
  village: 'Village 1',
  bankAccount: 'ACC1234567890',
  ifscCode: 'SBIN0001234',
  language: 'en',
};

const DEMO_CENTRES = [
  { id: 'centre-001', code: 'KRN001', name: 'Karnal Mandi' },
  { id: 'centre-002', code: 'PNP001', name: 'Panipat Centre' },
  { id: 'centre-003', code: 'KKR001', name: 'Kurukshetra Depot' },
  { id: 'centre-004', code: 'AMB001', name: 'Ambala Hub' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [farmer, setFarmerState] = useState<FarmerProfile | null>(null);
  const [centreId, setCentreIdState] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    if (r === Role.FARMER && !farmer) {
      setFarmerState(DEMO_FARMER);
    }
  }, [farmer]);

  const setFarmer = useCallback((f: FarmerProfile | null) => {
    setFarmerState(f);
  }, []);

  const setCentreId = useCallback((c: string | null) => {
    setCentreIdState(c);
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
  }, []);

  const login = useCallback((r: Role, f?: FarmerProfile, c?: string, t?: string) => {
    setRoleState(r);
    if (f) setFarmerState(f);
    else if (r === Role.FARMER) setFarmerState(DEMO_FARMER);
    if (c) setCentreIdState(c);
    if (t) setTokenState(t);
  }, []);

  const logout = useCallback(() => {
    setRoleState(null);
    setFarmerState(null);
    setCentreIdState(null);
    setTokenState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        farmer,
        centreId,
        token,
        setRole,
        setFarmer,
        setCentreId,
        setToken,
        login,
        logout,
        isLoggedIn: !!role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}