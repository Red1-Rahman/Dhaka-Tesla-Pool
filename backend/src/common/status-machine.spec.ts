import { ConflictException } from '@nestjs/common';
import {
  assertTransition,
  canTransition,
} from './status-machine';

describe('status machine', () => {
  describe('canTransition', () => {
    it.each([
      ['REQUESTED', 'MATCHED'],
      ['REQUESTED', 'CANCELLED'],
      ['MATCHED', 'DRIVER_ARRIVED'],
      ['MATCHED', 'CANCELLED'],
      ['DRIVER_ARRIVED', 'STARTED'],
      ['STARTED', 'COMPLETED'],
    ])('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    it.each([
      ['REQUESTED', 'STARTED'],
      ['REQUESTED', 'COMPLETED'],
      ['MATCHED', 'STARTED'],
      ['MATCHED', 'COMPLETED'],
      ['DRIVER_ARRIVED', 'COMPLETED'],
      ['DRIVER_ARRIVED', 'CANCELLED'],
      ['STARTED', 'CANCELLED'],
      ['COMPLETED', 'STARTED'],
      ['COMPLETED', 'CANCELLED'],
      ['CANCELLED', 'MATCHED'],
      ['CANCELLED', 'STARTED'],
      ['CANCELLED', 'COMPLETED'],
    ])('rejects %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });

    it('rejects unknown source statuses', () => {
      expect(canTransition('UNKNOWN', 'MATCHED')).toBe(false);
    });

    it('rejects unknown target statuses', () => {
      expect(canTransition('REQUESTED', 'UNKNOWN')).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it.each([
      ['REQUESTED', 'MATCHED'],
      ['REQUESTED', 'CANCELLED'],
      ['MATCHED', 'DRIVER_ARRIVED'],
      ['MATCHED', 'CANCELLED'],
      ['DRIVER_ARRIVED', 'STARTED'],
      ['STARTED', 'COMPLETED'],
    ])('does not throw for %s -> %s', (from, to) => {
      expect(() => assertTransition(from, to)).not.toThrow();
    });

    it.each([
      ['COMPLETED', 'STARTED'],
      ['COMPLETED', 'CANCELLED'],
      ['CANCELLED', 'MATCHED'],
      ['CANCELLED', 'STARTED'],
      ['REQUESTED', 'STARTED'],
      ['REQUESTED', 'COMPLETED'],
      ['MATCHED', 'STARTED'],
      ['MATCHED', 'COMPLETED'],
    ])('throws ConflictException for %s -> %s', (from, to) => {
      expect(() => assertTransition(from, to)).toThrow(
        ConflictException,
      );
    });

    it('includes the invalid transition in the error message', () => {
      expect(() =>
        assertTransition('COMPLETED', 'STARTED'),
      ).toThrow(
        'Cannot transition ride from COMPLETED to STARTED',
      );
    });
  });
});
