import { BadRequestException } from '@nestjs/common';
import { validateWorkingHours } from './staff.service';

describe('validateWorkingHours', () => {
  it('accepts split shifts on the same day', () => {
    expect(() =>
      validateWorkingHours([
        { weekday: 1, startMinute: 540, endMinute: 780 },
        { weekday: 1, startMinute: 960, endMinute: 1200 },
      ]),
    ).not.toThrow();
  });

  it('rejects ranges that end before they start', () => {
    expect(() => validateWorkingHours([{ weekday: 2, startMinute: 600, endMinute: 600 }])).toThrow(
      BadRequestException,
    );
  });

  it('rejects overlapping ranges on the same day', () => {
    expect(() =>
      validateWorkingHours([
        { weekday: 3, startMinute: 540, endMinute: 780 },
        { weekday: 3, startMinute: 720, endMinute: 900 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('allows the same hours on different days', () => {
    expect(() =>
      validateWorkingHours([
        { weekday: 3, startMinute: 540, endMinute: 780 },
        { weekday: 4, startMinute: 540, endMinute: 780 },
      ]),
    ).not.toThrow();
  });
});
