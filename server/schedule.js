const DEFAULT_CONSTRAINTS = {
  morning: [
    (group) => group.some(emp => emp.isShiftLead),
  ],
  noon: [
    (group) => group.filter(emp => emp.seniority === "junior").length < 2,
  ],
  night: [
    (group) => group.filter(emp => emp.seniority === "junior").length < 2,
  ],
};

export function solveSchedule(employees, availability, shifts, constraints = DEFAULT_CONSTRAINTS) {
  const assignments = [];
  const shiftCount = {};
  employees.forEach(emp => { shiftCount[emp.id] = 0; });

  for (const shift of shifts) {
    const candidates = getAvailableCandidates(employees, availability, shift);
    candidates.sort((a, b) => shiftCount[a.id] - shiftCount[b.id]);

    const chosenGroup = findValidCombination(candidates, shift, constraints);

    if (chosenGroup) {
      chosenGroup.forEach(emp => { shiftCount[emp.id]++; });
      assignments.push({ shift, employees: chosenGroup, isFullyStaffed: true });
    } else {
      assignments.push({
        shift,
        employees: candidates.slice(0, shift.requiredCount),
        isFullyStaffed: false,
      });
    }
  }

  return assignments;
}


export function getAvailableCandidates(employees, availability, shift) {
  const availableIds = availability
    .filter(a => a.date === shift.date && a.shiftType === shift.shiftType)
    .map(a => a.employeeId);

  return employees.filter(emp => availableIds.includes(emp.id));
}

export function isValidAssignment(group, shift, constraints = DEFAULT_CONSTRAINTS) {
    if (group.length < shift.requiredCount) return false;

    const rulesForThisShift = constraints[shift.shiftType] || [];
    return rulesForThisShift.every(rule => rule(group));
}

export function findValidCombination(candidates, shift, constraints = DEFAULT_CONSTRAINTS) {
    function tryBuild(currentGroup, startIndex) {
        if (currentGroup.length === shift.requiredCount) 
            return isValidAssignment(currentGroup, shift, constraints) ? currentGroup: null;

        for (let i = startIndex; i < candidates.length; i++) {
            currentGroup.push(candidates[i]) ;
            
            const result =tryBuild(currentGroup, i + 1)
            if (result != null) return result;
            currentGroup.pop();
        }
            return null;
        }
        return tryBuild([], 0);   
}


    


