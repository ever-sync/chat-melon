import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('deve combinar classes CSS corretamente', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('deve lidar com classes condicionais', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toContain('base');
      expect(result).toContain('conditional');
      expect(result).not.toContain('hidden');
    });

    it('deve remover classes duplicadas', () => {
      const result = cn('class1', 'class1');
      // tailwind-merge deve remover duplicatas
      expect(result.split(' ').filter((c) => c === 'class1').length).toBeLessThanOrEqual(1);
    });
  });
});

