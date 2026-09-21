import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { TranslationProvider } from './context/TranslationContext'
import { FeatureFlagsProvider } from './context/FeatureFlagsContext'
import { ThemeProvider } from './context/ThemeContext'
import "./assets/font/fonts.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TranslationProvider>
          <FeatureFlagsProvider>
            <App />
          </FeatureFlagsProvider>
        </TranslationProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
