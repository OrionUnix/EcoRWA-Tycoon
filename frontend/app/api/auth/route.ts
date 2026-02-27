import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { auth } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, message, signature } = body;

        if (!address || !message || !signature) {
            return NextResponse.json(
                { error: 'Missing required fields (address, message, signature)' },
                { status: 400 }
            );
        }

        // 1. Verify the signature cryptographically with Viem
        const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid signature. Authentication failed.' },
                { status: 401 }
            );
        }

        // 2. Signature is valid: User owns the wallet. 
        // Mint a Firebase Custom Token for this specific address (UID).
        const customToken = await auth.createCustomToken(address.toLowerCase());

        return NextResponse.json({ customToken });

    } catch (error: any) {
        console.error('API /api/auth Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
