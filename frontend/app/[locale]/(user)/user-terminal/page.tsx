import UserTerminalClient from './components/UserTerminalClient';

export function generateStaticParams() {
    return [
        { locale: 'en' },
        { locale: 'fr' }
    ];
}

export default function UserTerminalGame() {
    return <UserTerminalClient />;
}
