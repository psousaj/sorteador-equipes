import { AppProvider, useApp } from './context/AppContext';
import { HomeScreen } from './screens/HomeScreen';
import { AnimationScreen } from './screens/AnimationScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';

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
