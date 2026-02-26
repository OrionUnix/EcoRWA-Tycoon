import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// ─── Constantes ──────────────────────────────────────────────────────────────

const RWA_FILE_MAP: Record<number, string> = {
    1: 'loft.png',
    2: 'bistro.png',
    3: 'eco.png',
};

export const ASSET_DETAILS: Record<number, {
    key: string; apy: string; totalShares: number;
    loc: string; price: string; vac: string; pop: string; cost: number;
}> = {
    1: { key: 'loft', apy: '4.2%', totalShares: 10000, loc: 'New York', price: '$14 230', vac: '1.5%', pop: '8.3M', cost: 150 },
    2: { key: 'bistro', apy: '7.8%', totalShares: 5000, loc: 'Paris', price: '10 580 €', vac: '2.8%', pop: '2.1M', cost: 100 },
    3: { key: 'tower', apy: '6.5%', totalShares: 20000, loc: 'Paris', price: '11 200 €', vac: '1.2%', pop: '2.1M', cost: 250 },
};

export const getAssetDetails = (id: number) =>
    ASSET_DETAILS[id] ?? { key: 'loft', apy: '0%', totalShares: 1000, loc: '-', price: '-', vac: '-', pop: '-', cost: 100 };

export const getDynamicPrice = (id: number) => {
    const base = getAssetDetails(id).cost;
    if (localStorage.getItem(`gov_done_${id}`) === 'true')
        return id === 2 ? base * 0.92 : base * 1.08;
    return base;
};

const generateRandomTxID = () => {
    let hash = '0x';
    for (let i = 0; i < 64; i++) hash += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return hash;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRWAInventory() {
    const tInv = useTranslations('inventory');
    const tBob = useTranslations('bob');

    const [inventory, setInventory] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [liveYield, setLiveYield] = useState(0);
    const [claimStatus, setClaimStatus] = useState('');
    const [isTypingImpact, setIsTypingImpact] = useState(true);

    // Gouvernance
    const [showGovernance, setShowGovernance] = useState(false);
    const [govTargetItem, setGovTargetItem] = useState<any | null>(null);
    const [isTypingGov, setIsTypingGov] = useState(true);
    const [voteSuccess, setVoteSuccess] = useState(false);
    const [showGovDetails, setShowGovDetails] = useState(false);

    // Bâtiments placés sur la map
    const [placedIds, setPlacedIds] = useState<Set<number>>(() => {
        try { return new Set<number>(JSON.parse(localStorage.getItem('rwa_placed_ids') || '[]')); }
        catch { return new Set<number>(); }
    });

    // Chargement inventaire
    const loadInventory = useCallback(() => {
        const stored = JSON.parse(localStorage.getItem('rwa_inventory') || '[]');
        setInventory(stored.map((item: any, idx: number) => ({ ...item, uniqueKey: `${item.id}-${idx}` })));
    }, []);

    useEffect(() => {
        loadInventory();
        window.addEventListener('rwa_purchased', loadInventory);
        return () => window.removeEventListener('rwa_purchased', loadInventory);
    }, [loadInventory]);

    // Trigger Gouvernance automatique après 8s
    useEffect(() => {
        if (!inventory.length || showGovernance) return;
        const pending = inventory.find(item => localStorage.getItem(`gov_done_${item.id}`) !== 'true');
        if (!pending) return;
        const t = setTimeout(() => {
            setGovTargetItem(pending);
            setShowGovernance(true);
            setIsTypingGov(true);
            setVoteSuccess(false);
            setShowGovDetails(false);
        }, 8000);
        return () => clearTimeout(t);
    }, [inventory, showGovernance]);

    // Yield en temps réel
    useEffect(() => {
        if (!selectedItem) { setLiveYield(0); setClaimStatus(''); return; }
        setLiveYield(2.3456 * selectedItem.amount);
        const iv = setInterval(() => setLiveYield(p => p + 0.0011 * selectedItem.amount), 1000);
        return () => clearInterval(iv);
    }, [selectedItem]);

    // Reset typewriter quand on change d'item
    useEffect(() => { if (selectedItem) setIsTypingImpact(true); }, [selectedItem?.id]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleClaim = () => {
        if (liveYield > 0) {
            setClaimStatus(tInv('claim_success'));
            setLiveYield(0);
            setTimeout(() => setClaimStatus(''), 4000);
        }
    };

    const handleVote = (choice: string) => {
        if (!govTargetItem) return;
        localStorage.setItem(`gov_done_${govTargetItem.id}`, 'true');
        setVoteSuccess(true);
        setIsTypingGov(true);
        setTimeout(() => { setShowGovernance(false); setGovTargetItem(null); }, 4000);
    };

    const handleTrade = (type: 'buy' | 'sell') => {
        if (!selectedItem) return;
        const price = getDynamicPrice(selectedItem.id);
        const newTxHash = generateRandomTxID();
        const shortTx = `${newTxHash.slice(0, 6)}...${newTxHash.slice(-4)}`;
        let inv = JSON.parse(localStorage.getItem('rwa_inventory') || '[]');
        const idx = inv.findIndex((i: any) => i.id === selectedItem.id);
        if (type === 'sell') {
            if (inv[idx].amount > 1) {
                inv[idx].amount -= 1; inv[idx].otcTxHash = newTxHash;
                setSelectedItem({ ...selectedItem, amount: selectedItem.amount - 1, otcTxHash: newTxHash });
                setClaimStatus(tInv('sell_success', { price: price.toFixed(2), tx: shortTx }));
            } else { inv.splice(idx, 1); setSelectedItem(null); }
        } else {
            inv[idx].amount += 1; inv[idx].otcTxHash = newTxHash;
            setSelectedItem({ ...selectedItem, amount: selectedItem.amount + 1, otcTxHash: newTxHash });
            setClaimStatus(tInv('buy_success', { price: price.toFixed(2), tx: shortTx }));
        }
        localStorage.setItem('rwa_inventory', JSON.stringify(inv));
        window.dispatchEvent(new Event('rwa_purchased'));
        setTimeout(() => setClaimStatus(''), 5000);
    };

    const handlePlaceOnMap = useCallback((item: any) => {
        if (!item || placedIds.has(item.id)) return;
        const fileName = RWA_FILE_MAP[item.id] ?? `${item.imageName}.png`;
        const texturePath = `/assets/isometric/Spritesheet/Buildings/RWA/${fileName}`;

        // Dispatch "equip" instead of auto-place
        window.dispatchEvent(new CustomEvent('equip_rwa_building', {
            detail: { rwaId: item.id, texturePath, imageName: item.imageName }
        }));

        setClaimStatus(tBob('rwa_placed_confirm'));
        setTimeout(() => setClaimStatus(''), 5000);
    }, [placedIds, tBob]);

    return {
        inventory, selectedItem, setSelectedItem,
        liveYield, claimStatus, isTypingImpact, setIsTypingImpact,
        showGovernance, govTargetItem, isTypingGov, setIsTypingGov,
        voteSuccess, showGovDetails, setShowGovDetails,
        placedIds,
        handleClaim, handleVote, handleTrade, handlePlaceOnMap,
    };
}
