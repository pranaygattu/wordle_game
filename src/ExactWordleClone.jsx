import React, { useEffect, useState } from 'react';
import englishWords from 'an-array-of-english-words';

/***********************************************
 * WORDLE CLONE WITH AN-ARRAY-OF-ENGLISH-WORDS
 * --------------------------------------------
 * - Filters dictionary to 5-letter words
 * - Picks a random word each refresh
 * - Renders a modal pop-up on game over
 * - Tailwind classes for styling
 ***********************************************/

// Filter to get only 5-letter words (Note: This loads all ~270k words into memory!)
const ALL_FIVE_LETTER_WORDS = englishWords.filter((word) => word.length === 5);

// On-screen keyboard rows
const KEYBOARD_LAYOUT = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','DELETE']
];

export default function ExactWordleClone() {
  // The hidden solution word (randomly picked on mount)
  const [solution, setSolution] = useState('');

  // Store up to 6 guesses in an array of strings
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  // Current row index (0 to 5)
  const [currentRow, setCurrentRow] = useState(0);
  // Indicates whether the game is finished (win or lose)
  const [isGameOver, setIsGameOver] = useState(false);

  // Color states for each row: colorStates[rowIndex] = ['green','gray','yellow','gray','green']
  const [colorStates, setColorStates] = useState(
    Array(6).fill(Array(5).fill(''))
  );

  // Track letter statuses for the on-screen keyboard (e.g., { 'A': 'green', 'B': 'gray' })
  const [keyStatuses, setKeyStatuses] = useState({});

  // On mount, pick a random 5-letter word
  useEffect(() => {
    if (ALL_FIVE_LETTER_WORDS.length === 0) return; // Safety check if for some reason no words
    const randomIndex = Math.floor(Math.random() * ALL_FIVE_LETTER_WORDS.length);
    const chosen = ALL_FIVE_LETTER_WORDS[randomIndex].toUpperCase();
    setSolution(chosen);
  }, []);

  // Compare a guess vs the solution, returning an array of color states for each letter
  const evaluateGuess = (guess) => {
    if (guess.length < 5) {
      return Array(5).fill('');
    }

    const result = Array(5).fill('gray');
    const solutionArr = solution.split('');
    const guessArr = guess.split('');

    // First pass: mark greens
    guessArr.forEach((letter, i) => {
      if (solutionArr[i] === letter) {
        result[i] = 'green';
        // Remove the matched letter to avoid double-counting in the yellow pass
        solutionArr[i] = null;
      }
    });

    // Second pass: mark yellows
    guessArr.forEach((letter, i) => {
      if (result[i] === '') {
        if (solutionArr.includes(letter)) {
          result[i] = 'yellow';
          // Remove that letter from solutionArr so it's not reused
          solutionArr[solutionArr.indexOf(letter)] = null;
        } else {
          result[i] = 'gray';
        }
      }
    });
    return result;
  };

  // Update the color states for a specific row, plus the keyboard letter statuses
  const updateRowColors = (rowIndex, guess) => {
    const newColors = evaluateGuess(guess);
    setColorStates((prev) => {
      const copy = [...prev];
      copy[rowIndex] = newColors;
      return copy;
    });

    // Update keyboard statuses
    const newKeyStatuses = { ...keyStatuses };
    guess.split('').forEach((letter, i) => {
      const c = newColors[i];
      // Priority: green > yellow > gray
      if (c === 'green' || (c === 'yellow' && newKeyStatuses[letter] !== 'green')) {
        newKeyStatuses[letter] = c;
      } else if (!newKeyStatuses[letter]) {
        newKeyStatuses[letter] = c;
      }
    });
    setKeyStatuses(newKeyStatuses);
  };

  // Handle keyboard presses (physical or on-screen)
  const handleKeyPress = (key) => {
    if (isGameOver) return;

    // Submit guess
    if (key === 'ENTER') {
      if (guesses[currentRow].length === 5) {
        updateRowColors(currentRow, guesses[currentRow]);

        // Win or lose check
        if (guesses[currentRow] === solution || currentRow === 5) {
          setIsGameOver(true);
        } else {
          setCurrentRow(currentRow + 1);
        }
      }
      return;
    }

    // Deletion
    if (key === 'DELETE') {
      const currentGuess = guesses[currentRow];
      if (currentGuess.length > 0) {
        updateCurrentGuess(currentGuess.slice(0, -1));
      }
      return;
    }

    // Letter input
    if (/^[A-Z]$/.test(key)) {
      const currentGuess = guesses[currentRow];
      if (currentGuess.length < 5) {
        updateCurrentGuess(currentGuess + key);
      }
    }
  };

  // Update the guess string in the current row
  const updateCurrentGuess = (newVal) => {
    setGuesses((prev) => {
      const copy = [...prev];
      copy[currentRow] = newVal;
      return copy;
    });
  };

  // Listen for physical keyboard events
  useEffect(() => {
    const handlePhysicalKey = (e) => {
      let key = e.key;
      if (key === 'Backspace') key = 'DELETE';
      if (key === 'Enter') key = 'ENTER';
      handleKeyPress(key.toUpperCase());
    };

    window.addEventListener('keydown', handlePhysicalKey);
    return () => window.removeEventListener('keydown', handlePhysicalKey);
  }, [guesses, currentRow, isGameOver]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 text-white py-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-widest">WORDLE</h1>
      </header>

      {/* The guesses grid */}
      <div className="grid grid-rows-6 gap-2 mb-8">
        {guesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, colIndex) => {
              const letter = guess[colIndex] || '';
              const color = colorStates[rowIndex][colIndex];
              let bgColor = 'bg-gray-800 border-gray-600';
              if (color === 'green') bgColor = 'bg-green-600 border-green-600';
              if (color === 'yellow') bgColor = 'bg-yellow-500 border-yellow-500';
              if (color === 'gray') bgColor = 'bg-gray-500 border-gray-500';

              return (
                <div
                  key={colIndex}
                  className={`w-14 h-14 flex items-center justify-center text-2xl font-bold uppercase border-2 ${bgColor}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* On-screen keyboard */}
      <div className="space-y-2">
        {KEYBOARD_LAYOUT.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1">
            {row.map((key) => {
              let widthClass = 'w-10';
              if (key === 'ENTER' || key === 'DELETE') {
                widthClass = 'w-16';
              }
              let colorClass = 'bg-gray-500';
              if (keyStatuses[key] === 'green') colorClass = 'bg-green-600';
              if (keyStatuses[key] === 'yellow') colorClass = 'bg-yellow-500';
              if (keyStatuses[key] === 'gray') colorClass = 'bg-gray-700';

              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`${widthClass} h-12 rounded-md flex items-center justify-center font-bold uppercase ${colorClass} text-white`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal Pop-up on Game Over */}
      {isGameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white text-black rounded p-6 space-y-4 max-w-xs text-center">
            {guesses[currentRow] === solution || guesses[currentRow - 1] === solution ? (
              <p className="text-xl font-bold">You guessed it! The word was {solution}.</p>
            ) : (
              <p className="text-xl font-bold">Game Over! The word was {solution}.</p>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
