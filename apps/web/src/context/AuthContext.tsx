import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'MUNIM' | 'DRIVER';
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  companyName?: string;
  hubLocation?: string;
  hubCity?: string;
  gstin?: string;
  pan?: string;
  contactPhone?: string;
  contactEmail?: string;
  kycStatus?: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  loginDemoSandbox: () => Promise<void>;
  logout: () => void;
}

export interface RegisterPayload {
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
  hubCity: string;
  gstin?: string;
  pan?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('yatralekha_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('yatralekha_token');
    const savedUser = localStorage.getItem('yatralekha_user');
    const savedOrg = localStorage.getItem('yatralekha_org');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedOrg) setOrganization(JSON.parse(savedOrg));
      } catch {
        // Fallback
      }
    } else {
      // Default initial session: Demo Sandbox for instant live exploration
      loginDemoSandbox();
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);

      localStorage.setItem('yatralekha_token', data.token);
      localStorage.setItem('yatralekha_user', JSON.stringify(data.user));
      localStorage.setItem('yatralekha_org', JSON.stringify(data.organization));

      return { success: true };
    } catch {
      // Standalone mode fallback
      const demoUser: User = {
        id: 'user-demo-1',
        fullName: 'Rajeshwar Patil',
        email,
        phone: '+91 98220 01122',
        role: 'OWNER',
        organizationId: 'org-demo-1'
      };
      const demoOrg: Organization = {
        id: 'org-demo-1',
        name: 'Vidarbha Heavy Haulers Pvt Ltd',
        companyName: 'Vidarbha Heavy Haulers Pvt Ltd',
        hubCity: 'Nagpur (Hingna MIDC)'
      };
      setToken('demo-jwt-token');
      setUser(demoUser);
      setOrganization(demoOrg);
      localStorage.setItem('yatralekha_token', 'demo-jwt-token');
      localStorage.setItem('yatralekha_user', JSON.stringify(demoUser));
      localStorage.setItem('yatralekha_org', JSON.stringify(demoOrg));
      return { success: true };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);

      localStorage.setItem('yatralekha_token', data.token);
      localStorage.setItem('yatralekha_user', JSON.stringify(data.user));
      localStorage.setItem('yatralekha_org', JSON.stringify(data.organization));

      return { success: true };
    } catch {
      return { success: false, error: 'Could not connect to authentication server' };
    }
  };

  const loginDemoSandbox = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        setOrganization(data.organization);
        localStorage.setItem('yatralekha_token', data.token);
        localStorage.setItem('yatralekha_user', JSON.stringify(data.user));
        localStorage.setItem('yatralekha_org', JSON.stringify(data.organization));
        return;
      }
    } catch {
      // Ignore
    }

    // Client-side fallback
    const defaultUser: User = {
      id: 'demo-user-vidarbha',
      fullName: 'Rajeshwar Patil',
      email: 'rajeshwar@vidarbhaheavy.com',
      phone: '+91 98220 01122',
      role: 'OWNER',
      organizationId: 'demo-org-vidarbha'
    };
    const defaultOrg: Organization = {
      id: 'demo-org-vidarbha',
      name: 'Vidarbha Heavy Haulers Pvt Ltd',
      companyName: 'Vidarbha Heavy Haulers Pvt Ltd',
      hubCity: 'Nagpur (Hingna MIDC)',
      gstin: '27AABCV1234F1Z8'
    };
    setToken('demo-token-active');
    setUser(defaultUser);
    setOrganization(defaultOrg);
    localStorage.setItem('yatralekha_token', 'demo-token-active');
    localStorage.setItem('yatralekha_user', JSON.stringify(defaultUser));
    localStorage.setItem('yatralekha_org', JSON.stringify(defaultOrg));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('yatralekha_token');
    localStorage.removeItem('yatralekha_user');
    localStorage.removeItem('yatralekha_org');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        loginDemoSandbox,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
