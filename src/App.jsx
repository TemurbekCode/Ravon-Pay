import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './frontend/providers/ThemeProvider.jsx';
import { LanguageProvider } from './frontend/providers/LanguageProvider.jsx';
import { AuthProvider } from './frontend/providers/AuthProvider.jsx';
import { useAuth } from './hooks/useAuth.js';
import SplashScreen from './frontend/shared/SplashScreen.jsx';
import AppRouter from './router/AppRouter.jsx';
import './App.css';

// Saytga birinchi kirishda token tiklanayotgan payt (auth holati aniqlanmaguncha)
// — router hali qaysi sahifani ko'rsatishni bilmaydi, shuning uchun shu yerda kutiladi.
function AppGate() {
  const { loading } = useAuth();
  if (loading) return <SplashScreen />;
  return <AppRouter />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppGate />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
