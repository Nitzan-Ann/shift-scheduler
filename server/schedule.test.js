import test from 'node:test';
import assert from 'node:assert';
import { solveSchedule, getAvailableCandidates, isValidAssignment, findValidCombination} from './schedule.js';


test('getAvailableCandidates - returns employee with matching availability', () => {
    const employees = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: true }
  ];
  const availability = [
    { employeeId: 1, date: "2026-08-25", shiftType: "morning" }
  ];
  const shift = { date: "2026-08-25", shiftType: "morning", requiredCount: 1 };

  
  const result = getAvailableCandidates(employees, availability, shift);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 1);
});

test('getAvailableCandidates - excludes employee with different date or shift type', () => {
    const employees = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: true }
  ];
  const availability = [
    { employeeId: 1, date: "2026-08-25", shiftType: "morning" }
  ];
  const shift = { date: "2026-08-24", shiftType: "noon", requiredCount: 1 };

  
  const result = getAvailableCandidates(employees, availability, shift);
  assert.strictEqual(result.length, 0);
});

test('getAvailableCandidates - returns empty array when no one is available', () => {
  const employees = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: true }
  ];
  const availability = [];
  const shift = { date: "2026-08-25", shiftType: "morning", requiredCount: 1 };

  const result = getAvailableCandidates(employees, availability, shift);

  assert.strictEqual(result.length, 0);
});

test('isValidAssignment - rejects morning group with no shift lead present', () => {
  const group = [
    { id: 1, name: "Dana", seniority: "junior", isShiftLead: false }, { id: 2, name: "David", seniority: "senior", isShiftLead: false },
    { id: 3, name: "Ellen", seniority: "junior", isShiftLead: false }
  ];
  const shift = { date: "2026-08-25", shiftType: "morning", requiredCount: 3 };

  const result = isValidAssignment(group, shift);

  assert.strictEqual(result, false);
});

test('isValidAssignment - rejects noon shift with two juniors', () => {
  const group = [
    { id: 1, name: "Dana", seniority: "junior", isShiftLead: false }, { id: 2, name: "Donna", seniority: "junior", isShiftLead: false },
  ];
  const shift = { date: "2026-06-12", shiftType: "noon", requiredCount: 2 };

  const result = isValidAssignment(group, shift);

  assert.strictEqual(result, false);
});

test('isValidAssignment - accepts noon shift with a senior and a junior', () => {
  const group = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: false }, { id: 2, name: "Donna", seniority: "junior", isShiftLead: false },
  ];
  const shift = { date: "2026-06-12", shiftType: "noon", requiredCount: 2 };

  const result = isValidAssignment(group, shift);

  assert.strictEqual(result, true);
});

test('isValidAssignment - rejects group smaller than required count', () => {
  const group = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: false }];

  const shift = { date: "2026-06-12", shiftType: "noon", requiredCount: 2 };

  const result = isValidAssignment(group, shift);

  assert.strictEqual(result, false);
});

test('findValidCombination - finds a valid combination among candidates', () => {
  const candidates = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: true },
    { id: 2, name: "David", seniority: "junior", isShiftLead: false },
    { id: 3, name: "Ellen", seniority: "junior", isShiftLead: false }
  ];

  const shift = { date: "2026-08-25", shiftType: "morning", requiredCount: 3 };

  const result = findValidCombination(candidates, shift);

  assert.strictEqual(result.length, 3);
  assert.strictEqual(result.some(emp => emp.isShiftLead), true);
});

test('findValidCombination - no valid combination among candidates', () => {
  const candidates = [
    { id: 1, name: "Dana", seniority: "junior", isShiftLead: false },
    { id: 2, name: "David", seniority: "junior", isShiftLead: false },
    { id: 3, name: "Ellen", seniority: "junior", isShiftLead: false }
  ];

  const shift = { date: "2026-08-25", shiftType: "morning", requiredCount: 3 };

  const result = findValidCombination(candidates, shift);

  assert.strictEqual(result, null);
});

test('findValidCombination - backtracks when first attempt fails, then succeeds', () => {
  const candidates = [
    { id: 1, name: "David", seniority: "junior", isShiftLead: false },
    { id: 2, name: "Ellen", seniority: "junior", isShiftLead: false },
    { id: 3, name: "Frank", seniority: "junior", isShiftLead: false },
    { id: 4, name: "Dana", seniority: "senior", isShiftLead: true }
  ];

  const shift = { date: "2026-08-25", shiftType: "morning", requiredCount: 3 };

  const result = findValidCombination(candidates, shift);

  assert.strictEqual(result.length, 3);
  assert.strictEqual(result.some(emp => emp.isShiftLead), true);
});

test('solveSchedule - fully staffs all shifts when enough valid candidates exist', () => {
  const employees = [
    { id: 1, name: "Dana", seniority: "senior", isShiftLead: true },
    { id: 2, name: "David", seniority: "junior", isShiftLead: false },
    { id: 3, name: "Ellen", seniority: "junior", isShiftLead: false },
    { id: 4, name: "Frank", seniority: "senior", isShiftLead: false },
    { id: 5, name: "Grace", seniority: "junior", isShiftLead: false },
  ];

  const availability = [
    { employeeId: 1, date: "2026-08-25", shiftType: "morning" },
    { employeeId: 2, date: "2026-08-25", shiftType: "morning" },
    { employeeId: 3, date: "2026-08-25", shiftType: "morning" },
    { employeeId: 4, date: "2026-08-25", shiftType: "noon" },
    { employeeId: 5, date: "2026-08-25", shiftType: "noon" },
  ];

  const shifts = [
    { date: "2026-08-25", shiftType: "morning", requiredCount: 3 },
    { date: "2026-08-25", shiftType: "noon", requiredCount: 2 },
  ];

  const result = solveSchedule(employees, availability, shifts);

  assert.strictEqual(result.every(a => a.isFullyStaffed), true);
});

test('solveSchedule - marks a shift as not fully staffed when no valid combination exists', () => {
  const employees = [
    { id: 1, name: "David", seniority: "junior", isShiftLead: false },
    { id: 2, name: "Ellen", seniority: "junior", isShiftLead: false },
    { id: 3, name: "Frank", seniority: "junior", isShiftLead: false },
  ];

  const availability = [
    { employeeId: 1, date: "2026-08-25", shiftType: "morning" },
    { employeeId: 2, date: "2026-08-25", shiftType: "morning" },
    { employeeId: 3, date: "2026-08-25", shiftType: "morning" },
  ];

  const shifts = [
    { date: "2026-08-25", shiftType: "morning", requiredCount: 3 },
  ];

  const result = solveSchedule(employees, availability, shifts);

  assert.strictEqual(result[0].isFullyStaffed, false);
});

