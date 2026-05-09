import { useState } from 'react';
import LandingPage from './LandingPage';
import Game from './Game';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      {isPlaying ? (
        <Game />
      ) : (
        <LandingPage onStart={() => setIsPlaying(true)} />
      )}
    </>
  );
}
