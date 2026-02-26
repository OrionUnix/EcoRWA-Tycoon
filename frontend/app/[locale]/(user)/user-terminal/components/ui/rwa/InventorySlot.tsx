import React from 'react';
import { motion } from 'framer-motion';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { useTranslations } from 'next-intl';
import { getAssetDetails } from '../../../hooks/useRWAInventory';

const BORDER_COLORS: Record<string, string> = {
    blue: 'border-[#4682B4]',
    orange: 'border-[#E66C2C]',
    green: 'border-[#4E9258]',
};

interface Props {
    item: any;
    onClick: (item: any) => void;
}

export const InventorySlot: React.FC<Props> = ({ item, onClick }) => {
    const tJordan = useTranslations('jordan');
    const tInv = useTranslations('inventory');

    return (
        <motion.div
            key={item.uniqueKey}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`relative w-16 h-20 bg-[#1e293b] border-4 ${BORDER_COLORS[item.colorTheme] ?? 'border-gray-500'} rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center group cursor-pointer hover:-translate-y-2 transition-transform`}
            onClick={() => onClick(item)}
        >
            <img
                src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${item.imageName}.png`)}
                alt="Icon"
                className="w-12 h-12 object-contain pixelated drop-shadow-md"
            />
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black z-10">
                x{item.amount}
            </div>
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-black/90 text-white text-[10px] font-bold p-2 rounded text-center border border-gray-600 z-20">
                {tJordan(`choices.${getAssetDetails(item.id).key}.name`)} <br />
                <span className="text-emerald-400">{tInv('active_yield')}</span>
            </div>
        </motion.div>
    );
};
