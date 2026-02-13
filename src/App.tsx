import { HashRouter, Routes, Route } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { Optimize } from './pages/Optimize';
import { History } from './pages/History';

function App() {
  return (
    <HashRouter>
      <div className="h-screen min-w-[375px] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Optimize />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
