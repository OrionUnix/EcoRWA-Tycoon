import TerminalClient from './TerminalClient';

// 1. Génération des paramètres pour l'export statique
export function generateStaticParams() {
  return [
    { locale: 'fr' },
    { locale: 'en' }
  ];
}

// 2. L'EXPORT PAR DÉFAUT (Le point bloquant)
export default function UserTerminalPage() {
  return <TerminalClient />;
}