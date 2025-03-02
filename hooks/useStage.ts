import { useState, useEffect } from 'react';
import { createStage } from '../gameHelpers';
import type { PLAYER } from '../types';

export const useStage = (player: PLAYER, resetPlayer: () => void) => {
  const [stage, setStage] = useState(createStage());
  const [rowsCleared, setRowsCleared] = useState(0);

  useEffect(() => {
    setRowsCleared(0);

    const updateStage = (prevStage: (string | number)[][]) => {
      // First flush the stage
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      );

      // Then draw the tetromino
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ];
          }
        });
      });

      // Then check if we collided
      if (player.collided) {
        resetPlayer();
        return sweepRows(newStage);
      }

      return newStage;
    };

    const sweepRows = (newStage: (string | number)[][]) => {
      const stage = newStage.reduce((acc, row) => {
        // If we don't find a 0 it means that the row is full and should be cleared
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          setRowsCleared(prev => prev + 1);
          // Create an empty row at the beginning
          acc.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          return acc;
        }
        acc.push(row);
        return acc;
      }, [] as (string | number)[][]);

      return stage;
    };

    // Here's the updates
    setStage(prev => updateStage(prev));
  }, [player, resetPlayer]);

  return [stage, setStage, rowsCleared] as const;
}; 