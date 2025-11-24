"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { countries, type Country } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { Award, RefreshCw } from 'lucide-react';

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return array.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

export default function FlagFrenzyGame() {
  const [gameCountries, setGameCountries] = useState<Country[]>([]);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [options, setOptions] = useState<Country[]>([]);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'incorrect' | 'finished'>('playing');
  const [selectedOption, setSelectedOption] = useState<Country | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalFlags = useMemo(() => countries.length, []);

  const pickNextCountry = useCallback((remainingCountries: Country[]) => {
    if (remainingCountries.length > 0) {
      const nextCountry = remainingCountries[0];
      const otherCountries = countries.filter(c => c.code !== nextCountry.code);
      const wrongOptions = shuffleArray(otherCountries).slice(0, 3);
      const newOptions = shuffleArray([nextCountry, ...wrongOptions]);

      setCurrentCountry(nextCountry);
      setOptions(newOptions);
      setGameCountries(remainingCountries.slice(1));
      setStatus('playing');
      setSelectedOption(null);
    } else {
      setStatus('finished');
    }
  }, []);

  useEffect(() => {
    const shuffled = shuffleArray([...countries]);
    setGameCountries(shuffled);
    pickNextCountry(shuffled);
  }, [pickNextCountry]);

  const handleOptionClick = (option: Country) => {
    if (status !== 'playing') return;

    setSelectedOption(option);

    if (option.code === currentCountry?.code) {
      setStatus('correct');
      setScore(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => {
        pickNextCountry(gameCountries);
        setShowConfetti(false);
      }, 2000);
    } else {
      setStatus('incorrect');
      setTimeout(() => {
        pickNextCountry(gameCountries);
      }, 2000);
    }
  };
  
  const handleRestart = () => {
    const shuffled = shuffleArray([...countries]);
    setGameCountries(shuffled);
    setScore(0);
    setCurrentCountry(null); 
    setStatus('playing');
    pickNextCountry(shuffled);
  };

  const remainingFlags = gameCountries.length + (status === 'finished' || status === 'playing' ? 0 : 1);

  if (status === 'finished') {
    return (
        <Card className="w-full max-w-md text-center shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Spiel beendet!</CardTitle>
                <CardDescription>Gut gemacht!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <Award className="h-24 w-24 text-primary" />
                <p className="text-xl">Deine Punktzahl: <span className="font-bold text-accent">{score} / {totalFlags}</span></p>
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
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-4xl text-primary">Flag Frenzy</CardTitle>
        <CardDescription className="text-lg">Welche Flagge ist das?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative h-48 w-full flex justify-center mb-4">
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

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
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

        {showFeedback && (
          <div className="flex h-12 items-center justify-center text-center text-lg font-semibold">
            {status === 'correct' && <span className="text-green-500">🎉 Richtig!</span>}
            {status === 'incorrect' && <span className="text-red-500">Falsch! Die richtige Antwort war {currentCountry.name}.</span>}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-secondary/50 p-4">
        <div className="text-sm text-muted-foreground">Punkte: <span className="font-bold text-foreground">{score}</span></div>
        <div className="text-sm text-muted-foreground">Verbleibend: <span className="font-bold text-foreground">{remainingFlags} / {totalFlags}</span></div>
      </CardFooter>
    </Card>
  );
}

// A simple confetti component for celebration
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
