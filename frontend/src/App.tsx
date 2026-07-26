import { BrowserRouter } from 'react-router-dom';
import { ColorModeProvider } from './theme/ColorModeContext';
import { AuthProvider } from './features/auth/AuthContext';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/FeedbackWidget/ErrorFeedback';

function App() {
  return (
    <ColorModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ColorModeProvider>
  );
}

export default App;
