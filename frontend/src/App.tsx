import { BrowserRouter } from 'react-router-dom';
import { ColorModeProvider } from './theme/ColorModeContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import { AuthProvider } from './features/auth/AuthContext';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/FeedbackWidget/ErrorFeedback';
import { BackendWarmupContainer } from './hooks/useBackendWarmup';

function App() {
  return (
    <ColorModeProvider>
      <ToastProvider>
        <AuthProvider>
          <BackendWarmupContainer>
            <BrowserRouter>
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
            </BrowserRouter>
          </BackendWarmupContainer>
        </AuthProvider>
      </ToastProvider>
    </ColorModeProvider>
  );
}

export default App;
