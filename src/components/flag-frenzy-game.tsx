"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { countries, type Country } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { Award, RefreshCw } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

const shuffleArray = <T,>(array: T[]): T[] => {
  return array.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

const GAME_STATE_KEY = 'flagFrenzyGameState';

type GameState = {
  gameCountries: Country[];
  currentCountry: Country | null;
  options: Country[];
  score: number;
  mistakes: number;
  status: 'playing' | 'correct' | 'incorrect' | 'finished';
};

export default function FlagFrenzyGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedOption, setSelectedOption] = useState<Country | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalFlags = useMemo(() => countries.length, []);

  const startGame = useCallback((state?: GameState | null) => {
    if (state) {
      setGameState(state);
    } else {
      const shuffled = shuffleArray([...countries]);
      const nextCountry = shuffled[0];
      const otherCountries = countries.filter(c => c.code !== nextCountry.code);
      const wrongOptions = shuffleArray(otherCountries).slice(0, 3);
      const newOptions = shuffleArray([nextCountry, ...wrongOptions]);

      setGameState({
        gameCountries: shuffled.slice(1),
        currentCountry: nextCountry,
        options: newOptions,
        score: 0,
        mistakes: 0,
        status: 'playing',
      });
    }
    setSelectedOption(null);
  }, []);

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(GAME_STATE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON) as GameState;
        if (savedState.status !== 'finished') {
          startGame(savedState);
        } else {
          startGame();
        }
      } else {
        startGame();
      }
    } catch (error) {
      console.error("Failed to load game state from localStorage", error);
      startGame();
    }
  }, [startGame]);

  useEffect(() => {
    if (gameState) {
      try {
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
      } catch (error) {
        console.error("Failed to save game state to localStorage", error);
      }
    }
  }, [gameState]);

  const pickNextCountry = useCallback((remainingCountries: Country[]) => {
    if (remainingCountries.length > 0) {
      const nextCountry = remainingCountries[0];
      const otherCountries = countries.filter(c => c.code !== nextCountry.code);
      const wrongOptions = shuffleArray(otherCountries).slice(0, 3);
      const newOptions = shuffleArray([nextCountry, ...wrongOptions]);

      setGameState(prev => prev ? {
        ...prev,
        currentCountry: nextCountry,
        options: newOptions,
        gameCountries: remainingCountries.slice(1),
        status: 'playing',
      } : null);
      setSelectedOption(null);
    } else {
      setGameState(prev => prev ? { ...prev, status: 'finished' } : null);
    }
  }, []);

  const handleOptionClick = (option: Country) => {
    if (!gameState || gameState.status !== 'playing') return;

    setSelectedOption(option);

    if (option.code === gameState.currentCountry?.code) {
      setGameState(prev => prev ? { ...prev, status: 'correct', score: prev.score + 1 } : null);
      setShowConfetti(true);
      setTimeout(() => {
        pickNextCountry(gameState.gameCountries);
        setShowConfetti(false);
      }, 2000);
    } else {
      setGameState(prev => prev ? { ...prev, status: 'incorrect', mistakes: prev.mistakes + 1 } : null);
      setTimeout(() => {
        pickNextCountry(gameState.gameCountries);
      }, 2000);
    }
  };
  
  const handleRestart = () => {
    localStorage.removeItem(GAME_STATE_KEY);
    startGame();
  };

  if (!gameState) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Flag Frenzy</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const { score, mistakes, status, currentCountry, options } = gameState;
  const remainingFlags = totalFlags - score - mistakes;

  if (status === 'finished') {
    return (
        <Card className="w-full max-w-md text-center shadow-2xl">
            <CardHeader className="relative">
                <div className="absolute top-4 right-4">
                    <ModeToggle />
                </div>
                <CardTitle className="font-headline text-3xl">Spiel beendet!</CardTitle>
                <CardDescription>Gut gemacht!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <Award className="h-24 w-24 text-primary" />
                <p className="text-xl">Deine Punktzahl: <span className="font-bold text-accent">{score} / {totalFlags}</span></p>
                <p className="text-lg">Fehler: <span className="font-bold text-destructive">{mistakes}</span></p>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button onClick={handleRestart}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Nochmal spielen
                </Button>
            </CardFooter>
        </Card>
    );
  }

  if (!currentCountry) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Flag Frenzy</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  const getButtonVariant = (option: Country) => {
    if (status === 'playing') return 'outline';
    if (option.code === currentCountry.code) return 'default';
    if (option.code === selectedOption?.code) return 'destructive';
    return 'outline';
  };

  const showFeedback = status === 'correct' || status === 'incorrect';

  return (
    <Card className="w-full max-w-md overflow-hidden shadow-2xl transition-all duration-500">
      {showConfetti && <Confetti />}
      <CardHeader className="text-center relative">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <CardTitle className="font-headline text-4xl text-primary">Flag Frenzy</CardTitle>
        <CardDescription className="text-lg">Welche Flagge ist das?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative h-48 w-full flex justify-center mb-0">
            <Image
              src={`https://flagcdn.com/w320/${currentCountry.code}.png`}
              alt="Länderflagge"
              width={320}
              height={192}
              className={cn(
                "rounded-lg border-4 border-card object-contain shadow-lg transition-all duration-300",
                status === 'correct' && 'scale-105 border-green-500',
                status === 'incorrect' && 'border-red-500'
              )}
              unoptimized
            />
        </div>

        <div className="flex h-12 items-center justify-center text-center text-lg font-semibold">
          {showFeedback ? (
            <>
              {status === 'correct' && <span className="text-green-500">🎉 Richtig!</span>}
              {status === 'incorrect' && <span className="text-red-500">Falsch! Die richtige Antwort war {currentCountry.name}.</span>}
            </>
          ) : null}
        </div>

        <div className="grid w-full max-w-sm grid-cols-1 gap-3">
          {options.map((option) => (
            <Button
              key={option.code}
              variant={getButtonVariant(option)}
              size="lg"
              onClick={() => handleOptionClick(option)}
              disabled={status !== 'playing'}
              className={cn(
                "h-auto min-h-14 py-2 justify-center text-center leading-tight whitespace-normal",
                status !== 'playing' && option.code !== currentCountry.code && 'opacity-50'
              )}
            >
              {option.name}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-secondary/50 p-4">
        <div className="text-sm text-muted-foreground">Punkte: <span className="font-bold text-foreground">{score}</span></div>
        <div className="text-sm text-muted-foreground">Fehler: <span className="font-bold text-destructive">{mistakes}</span></div>
        <div className="text-sm text-muted-foreground">Verbleibend: <span className="font-bold text-foreground">{remainingFlags} / {totalFlags}</span></div>
        <Button variant="ghost" size="sm" onClick={handleRestart}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}

const Confetti = () => {
    const confettiCount = 100;
    const confetti = useMemo(() => {
        return Array.from({ length: confettiCount }).map((_, i) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                transform: `rotate(${Math.random() * 360}deg)`,
            };
            return <div key={i} className="confetti-piece" style={style} />;
        });
    }, []);

    return <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">{confetti}</div>;
};
