import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Endpoint de secours pour la sauvegarde Beacon API
 * Navigator.sendBeacon envoie une requête POST sans attendre de réponse
 */
export async function POST(req: Request) {
    try {
        const { address, payload } = await req.json();

        if (!address || !payload) {
            return NextResponse.json({ error: 'Missing address or payload' }, { status: 400 });
        }

        console.log(`🔌 [Beacon API] Sauvegarde d'urgence reçue pour ${address}`);

        // On sauvegarde directement sur Firestore depuis le "serveur" (Next.js Edge/Serverless)
        const docRef = doc(db, 'saves', address.toLowerCase());
        await setDoc(docRef, payload);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ [Beacon API] Erreur:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
