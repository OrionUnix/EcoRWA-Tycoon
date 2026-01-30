import AdminStatsClient from './AdminStatsClient';

// Indispensable pour l'export statique GitHub Pages
export function generateStaticParams() {
  return [
    { locale: 'fr' },
    { locale: 'en' }
  ];
}

// Le "export default" que Next.js cherchait !
export default function AdminStatsPage() {
  return <AdminStatsClient />;
}