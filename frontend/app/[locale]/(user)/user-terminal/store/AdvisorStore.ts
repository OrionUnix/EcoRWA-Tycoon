import { useState, useEffect } from 'react';

type Listener = () => void;

class AdvisorStore {
    isOpen = false;
    message = '';
    showConnectButton = false;
    listeners = new Set<Listener>();

    subscribe = (listener: Listener) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    triggerAdvice = (message: string, showConnectButton: boolean = false) => {
        this.isOpen = true;
        this.message = message;
        this.showConnectButton = showConnectButton;
        this.notify();
    }

    closeAdvice = () => {
        this.isOpen = false;
        this.notify();
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}

export const advisorStore = new AdvisorStore();

export function useAdvisorStore() {
    const [state, setState] = useState({
        isOpen: advisorStore.isOpen,
        message: advisorStore.message,
        showConnectButton: advisorStore.showConnectButton
    });

    useEffect(() => {
        // Handle immediate updates if store changed before effect ran
        setState({
            isOpen: advisorStore.isOpen,
            message: advisorStore.message,
            showConnectButton: advisorStore.showConnectButton
        });

        return advisorStore.subscribe(() => {
            setState({
                isOpen: advisorStore.isOpen,
                message: advisorStore.message,
                showConnectButton: advisorStore.showConnectButton
            });
        });
    }, []);

    return state;
}
