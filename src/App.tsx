import { AppProvider, useApp } from './context/AppContext';
import { HomeScreen } from './screens/HomeScreen';
import { AnimationScreen } from './screens/AnimationScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';

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
    </AppProvider>
  );
}

export default App;
