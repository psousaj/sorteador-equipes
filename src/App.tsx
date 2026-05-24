import { AppProvider, useApp } from './context/AppContext';
import { HomeScreen } from './screens/HomeScreen';
import { AnimationScreen } from './screens/AnimationScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { Toaster } from 'sonner';

function ScreenRouter() {
  const { state } = useApp();

  switch (state.screen) {
    case 'home':
      return <HomeScreen />;
    case 'animation':
      return <AnimationScreen />;
    case 'result':
      return <ResultScreen />;
    case 'history':
      return <HistoryScreen />;
    case 'game':
      return <GameScreen />;
    case 'gameover':
      return <GameOverScreen />;
    default:
      return <HomeScreen />;
  }
}

function App() {
  return (
    <AppProvider>
      <ScreenRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FFF5F0',
            border: '2px solid #FF8C42',
            color: '#4A2800',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />
    </AppProvider>
  );
}

export default App;
