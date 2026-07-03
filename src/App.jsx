import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './frontend/providers/ThemeProvider.jsx';
import { LanguageProvider } from './frontend/providers/LanguageProvider.jsx';
import { AuthProvider } from './frontend/providers/AuthProvider.jsx';
import AppRouter from './router/AppRouter.jsx';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
