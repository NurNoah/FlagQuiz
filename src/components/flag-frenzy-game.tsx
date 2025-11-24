"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { countries, type Country } from '@/lib/countries';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Award, RefreshCw } from 'lucide-react';

const formSchema = z.object({
  guess: z.string().min(1, { message: 'Bitte gib einen Namen ein.' }),
});

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return array.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

export default function FlagFrenzyGame() {
  const [gameCountries, setGameCountries] = useState<Country[]>([]);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'incorrect-skip' | 'finished'>('playing');
  const [showConfetti, setShowConfetti] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guess: '',
    },
  });

  const remainingFlags = gameCountries.length;
  const totalFlags = useMemo(() => countries.length, []);

  const pickNextCountry = useCallback(() => {
    if (gameCountries.length > 0) {
      const nextCountry = gameCountries[0];
      setCurrentCountry(nextCountry);
      setGameCountries(prev => prev.slice(1));
      setStatus('playing');
      form.reset();
    } else {
      setStatus('finished');
    }
  }, [gameCountries, form]);

  useEffect(() => {
    setGameCountries(shuffleArray([...countries]));
  }, []);

  useEffect(() => {
    if (gameCountries.length > 0 && !currentCountry) {
      pickNextCountry();
    }
  }, [gameCountries, currentCountry, pickNextCountry]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentCountry || status !== 'playing') return;

    if (values.guess.trim().toLowerCase() === currentCountry.name.toLowerCase()) {
      setStatus('correct');
      setScore(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => {
        pickNextCountry();
        setShowConfetti(false);
      }, 2000);
    } else {
      form.setError('guess', { type: 'manual', message: 'Falsch! Versuche es erneut.' });
    }
  };

  const handleSkip = () => {
    if (status !== 'playing') return;
    setStatus('incorrect-skip');
    setTimeout(() => {
      pickNextCountry();
    }, 2000);
  };
  
  const handleRestart = () => {
    setGameCountries(shuffleArray([...countries]));
    setScore(0);
    setCurrentCountry(null); // This will trigger the useEffect to pick a new country
    setStatus('playing');
  };

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

  const feedbackClasses = cn({
    'border-green-500 bg-green-50 text-green-700': status === 'correct',
    'border-red-500 bg-red-50 text-red-700': status === 'incorrect-skip',
  });

  return (
    <Card className="w-full max-w-md overflow-hidden shadow-2xl transition-all duration-500">
      {showConfetti && <Confetti />}
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-4xl text-primary">Flag Frenzy</CardTitle>
        <CardDescription className="text-lg">Errate die Flagge!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative h-48 w-full">
            <Image
              src={`https://flagcdn.com/w320/${currentCountry.code}.png`}
              alt="Länderflagge"
              width={320}
              height={192}
              className={cn(
                "rounded-lg border-4 border-card object-contain shadow-lg transition-all duration-300",
                status === 'correct' && 'scale-105 border-accent',
                status === 'incorrect-skip' && 'opacity-50'
              )}
              unoptimized
            />
        </div>

        {status === 'correct' || status === 'incorrect-skip' ? (
          <div className={cn("flex h-24 flex-col items-center justify-center rounded-lg border-2 p-4 text-center text-lg font-semibold", feedbackClasses)}>
             {status === 'correct' && <><span className="text-2xl">🎉</span> Richtig!</>}
             {status === 'incorrect-skip' && <>Die richtige Antwort war: <span className="font-bold">{currentCountry.name}</span></>}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <FormField
                control={form.control}
                name="guess"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Land eingeben..."
                        {...field}
                        className="text-center text-lg h-12"
                        autoComplete="off"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" size="lg">Raten</Button>
                <Button type="button" variant="outline" size="lg" onClick={handleSkip}>Überspringen</Button>
              </div>
            </form>
          </Form>
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
