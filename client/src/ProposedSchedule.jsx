import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ProposedSchedule.css"


export default function ProposedSchedule() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [currentMonth, setCurrentMonth] = useState({
    year: nextMonthDate.getFullYear(),
    month: nextMonthDate.getMonth()
  });

  const [schedule, setSchedule] =useState([]);
  
  function goToPreviousMonth() {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  }
  
  function goToNextMonth() {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  }

  function getDaysInMonth(year, month){
    const daysCount = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return dateStr;
    });
  }

  
  async function loadSchedule() {
    try {
      const days = getDaysInMonth(currentMonth.year, currentMonth.month);
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

        const res = await fetch(`http://localhost:8000/api/schedule?from=${firstDay}&to=${lastDay}`);

        if (!res.ok) {
          console.error("Failed to load schedule");
          return;
        }

        const data = await res.json();
        setSchedule(data);
  
      } catch (err) {
        console.error("Error loading schedule:", err);
      }
  }
  useEffect(() => {
    loadSchedule();
    loadAvailability();
  }, [currentMonth]);

  function groupByShift(schedule){
    const groupedShiftsById = schedule.reduce((acc, assignment) => {
      const shiftId = assignment.shiftId;
      if (!acc[shiftId]) {
        acc[shiftId] = [];
      }
      acc[shiftId].push(assignment);
      return acc;
    }, {});
    return groupedShiftsById;
  }

  function sortAssignments(assignments, shiftType){
    assignments.sort((a, b) => {
        const scoreA = (Number(a.employee.isShiftLead) * 10) + Number(a.employee.seniority === "senior");
        const scoreB = (Number(b.employee.isShiftLead) * 10) + Number(b.employee.seniority === "senior");
        return scoreB - scoreA;
    });
    return assignments;
  }

   function findShiftItem(date, shiftType){
    const groups= Object.values(groupedShift)
    const found = groups.find(g => {
        return (g[0].shift.date.slice(0,10)===date 
                  && g[0].shift.shiftType===shiftType);
      });
    return found

   }

   async function handleGenerateSchedule() {
    setIsGenerating(true);

    try {
      const days = getDaysInMonth(currentMonth.year, currentMonth.month);
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

      const res = await fetch(`http://localhost:8000/api/schedule/generate?from=${firstDay}&to=${lastDay}`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Failed to generate schedule");
        return;
      }

        const data = await res.json();
        loadSchedule()
  
      } catch (err) {
        console.error("Error loading schedule:", err);

      } finally {
        setIsGenerating(false);
      }
  }

  async function handleConfirmSchedule() {
    try {
      const days = getDaysInMonth(currentMonth.year, currentMonth.month);
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

      const res = await fetch(`http://localhost:8000/api/schedule/confirm?from=${firstDay}&to=${lastDay}&status=confirmed`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Failed to confirm schedule");
        return;
      }

        const data = await res.json();
        loadSchedule()
  
      } catch (err) {
        console.error("Error confirming schedule:", err);
      }
  }

  async function handleUnconfirmSchedule() {
    try {
      const days = getDaysInMonth(currentMonth.year, currentMonth.month);
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

      const res = await fetch(`http://localhost:8000/api/schedule/confirm?from=${firstDay}&to=${lastDay}&status=proposed`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Failed to unconfirm schedule");
        return;
      }

        const data = await res.json();
        loadSchedule()
  
      } catch (err) {
        console.error("Error unconfirming schedule:", err);
      }
  }

  async function loadAvailability() {
    try {
        const days = getDaysInMonth(currentMonth.year, currentMonth.month);
        const firstDay = days[0];
        const lastDay = days[days.length - 1];

        const res = await fetch(`http://localhost:8000/api/availability?from=${firstDay}&to=${lastDay}`);
        if (!res.ok) {
            console.error("Failed to load availability");
            return;
        }
        const data = await res.json();
        setAvailability(data);
    } catch (err) {
        console.error("Error loading availability:", err);
    }
  }

  async function handleReassign(assignmentId, newEmployeeId) {
    try {
        const res = await fetch(`http://localhost:8000/api/schedule/assignment/${assignmentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newEmployeeId: Number(newEmployeeId) }),
        });
        if (!res.ok) {
            console.error("Failed to reassign");
            return;
        }
        loadSchedule();
    } catch (err) {
        console.error("Error reassigning:", err);
    }
  }


  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();
  const groupedShift = groupByShift(schedule)
  const isConfirmed = schedule.some(item => item.shift.status === "confirmed");


  return(
    <>
    <h1 className="page-title">Proposed Schedule</h1>
    <button className="back-btn" onClick={() => navigate("/")}>Back to Home</button>
    <div className="proposedschedule-page">
      <div className="month-nav">
        <button onClick={goToPreviousMonth}>← Previous</button>
        <h3 className="month-title">{monthNames[currentMonth.month]} {currentMonth.year}</h3>
        <button onClick={goToNextMonth}>Next →</button>
      </div>
      <div className="action-buttons">
        <button onClick={handleGenerateSchedule} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Schedule"}
        </button>
        {isConfirmed ? (
          <button onClick={handleUnconfirmSchedule}>Unconfirm</button>) : (
          <button onClick={handleConfirmSchedule}>Confirm Schedule</button>
        )}
        {isConfirmed && (
          <button onClick={() => window.print()}>Print Schedule</button>
        )}
      </div> 
      <div className="weekday-headers">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="calendar">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="schedule-day-cell empty"></div>
            ))}
            {getDaysInMonth(currentMonth.year, currentMonth.month).map(date => (
              <div key={date} className="schedule-day-cell">
                <div className="day-number">{date.slice(-2)}</div>
                {["morning", "noon", "night"].map(shift => {
                  const item = findShiftItem(date, shift);
                  const dayOfWeek = new Date(date).getDay();
                  const slotsCount = shift === "morning" ?
                   ((dayOfWeek === 5 || dayOfWeek === 6) ? 2 : 3): 2;
                  const sortedAssignments = item ? sortAssignments(item, shift) : [];
                  const availableForSlot = availability.filter(a =>
                    a.date.slice(0,10) === date && a.shiftType === shift
                  );
                  const uniqueAvailable = availableForSlot.filter((a, index) =>
                    availableForSlot.findIndex(b => b.employeeId === a.employeeId) === index
                );

                  return (
                  <div  key={shift} className="shift-group">
                    {Array.from({ length: slotsCount }, (_, i) => {
                      const assignment = sortedAssignments[i];
                      const otherAssignedIds = sortedAssignments.filter((a, idx) => idx !== i).map(a => a.employeeId);
                      const availableForDropdown = uniqueAvailable.filter(a => !otherAssignedIds.includes(a.employeeId));
                      return (
                        <select key={i} className="schedule-slot"
                        value={assignment ? assignment.employeeId : ""}
                        style={{ background: assignment?.employee?.isShiftLead ? "lightblue" : "white" }}
                        disabled={isConfirmed}
                        onChange={(e) => {if (assignment) {
                          handleReassign(assignment.id, e.target.value);}
                        }}
                        >
                          <option value="">-- Empty --</option>
                          {availableForDropdown.map(a => (
                            <option key={a.employeeId} value={a.employeeId}>
                              {a.employee.name}
                              </option>
                            ))}
                            </select>
                            );
                          })}
                  </div>
                );
              })}
            </div>
        ))}
      </div>
    </div>
    </>
  );
}