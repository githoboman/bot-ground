'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    userAddress: string | null;
    connectWallet: () => void;
    disconnectWallet: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userAddress, setUserAddress] = useState<string | null>(null);

    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        setIsAuthenticated(true);
                        setUserAddress(accounts[0]);
                    }
                } catch (error) {
                    console.error("Failed to check wallet connection", error);
                }
            }
        };
        checkConnection();

        if (typeof window !== 'undefined' && (window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setIsAuthenticated(true);
                    setUserAddress(accounts[0]);
                } else {
                    setIsAuthenticated(false);
                    setUserAddress(null);
                }
            });
            (window as any).ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }, []);

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    // Switch to BOT Chain Mainnet
                    try {
                        await (window as any).ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x2A5' }], // 677 in hex
                        });
                    } catch (switchError: any) {
                        if (switchError.code === 4902) {
                            await (window as any).ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0x2A5',
                                        chainName: 'BOT Chain',
                                        nativeCurrency: {
                                            name: 'BOT',
                                            symbol: 'BOT',
                                            decimals: 18,
                                        },
                                        rpcUrls: ['https://rpc.botchain.ai'],
                                        blockExplorerUrls: ['https://scan.botchain.ai/'],
                                    },
                                ],
                            });
                        }
                    }

                    setIsAuthenticated(true);
                    setUserAddress(accounts[0]);
                }
            } catch (error) {
                console.error("Failed to connect wallet", error);
            }
        } else {
            alert('Please install MetaMask or another EVM wallet to connect.');
        }
    };

    const disconnectWallet = () => {
        setIsAuthenticated(false);
        setUserAddress(null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                userAddress,
                connectWallet,
                disconnectWallet,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
