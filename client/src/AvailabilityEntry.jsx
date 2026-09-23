import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./AvailabilityEntry.css";

export default function AvailabilityEntry() {
  const navigate = useNavigate();
  const [availabilitySelections, setAvailabilitySelections] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [currentMonth, setCurrentMonth] = useState({
    year: nextMonthDate.getFullYear(),
    month: nextMonthDate.getMonth()
  });
  const [employees, setEmployees] = useState([]);
  const [enteredEmployeeIds, setEnteredEmployeeIds] = useState([]);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  async function loadEmployees() {
      try {
        const res = await fetch("http://localhost:8000/api/employees");

        if (!res.ok) {
          console.error("Failed to load employees");
          return;
        }

        const data = await res.json();
        setEmployees(data);
  
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    }
  
    useEffect(() => {
      loadEmployees();
    }, []);

    useEffect(() => {
      loadEnteredEmployees();
    }, [currentMonth]);

  function getDaysInMonth(year, month){
    const daysCount = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return dateStr;
    });
  }

 function toggleAvailability(date, shiftType) {
    const key = `${date}_${shiftType}`;
    setAvailabilitySelections(prev => ({
        ...prev,
        [key]: !prev[key]
    }));
  }

  async function loadEnteredEmployees(){
    const days = getDaysInMonth(currentMonth.year, currentMonth.month);
    const firstDay = days[0];
    const lastDay = days[days.length - 1];

    try {
        const res = await fetch(`http://localhost:8000/api/availability?from=${firstDay}&to=${lastDay}`);

        if (!res.ok) {
          console.error("Failed to load entered employees");
          return;
        }

        const data = await res.json();
        const ids = data.map(a => a.employeeId);
        const uniqueIds = new Set(ids);
        setEnteredEmployeeIds([...uniqueIds]);
  
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    }

  async function handleSaveAvailability(){
    try {
        const days = getDaysInMonth(currentMonth.year, currentMonth.month);
        const firstDay = days[0];
        const lastDay = days[days.length - 1];

        const url = `http://localhost:8000/api/employees/${selectedEmployee.id}/availability`;
        const entries = Object.entries(availabilitySelections);
        const entriesTrue= entries.filter(([key, value]) => value === true)
        const entriesSorted= entriesTrue.map(([key]) => {
          const [date, shiftType] = key.split('_');
          return { date, shiftType };
        })

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability: entriesSorted, from: firstDay, to: lastDay })
        })

        if (!res.ok) {
          console.error("Failed to save availability");
          return;
        }
        loadEnteredEmployees();
        setAvailabilitySelections({});
        setSelectedEmployee(null);
    

      } catch (err) {
        console.error("Error saving availability:", err);
      }
    }
  
  async function handleSelectEmployee(emp){
    try {
      const days = getDaysInMonth(currentMonth.year, currentMonth.month);
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

      const res = await fetch(`http://localhost:8000/api/availability?from=${firstDay}&to=${lastDay}`);

      if (!res.ok) {
        console.error("Failed to load employee availability");
        return;
      }

      const allAvailability = await res.json();

      const employeeAvailability = allAvailability.filter(a => a.employeeId === emp.id);

      const selections = {};
      employeeAvailability.forEach(a => {
        const shortDate = a.date.slice(0, 10);
        const key = `${shortDate}_${a.shiftType}`;
        selections[key] = true;
      });

      setSelectedEmployee(emp);
      setAvailabilitySelections(selections);
      

      } catch (err) {
        console.error("Error loading availability:", err);
      }
  }

  function goToNextMonth() {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  }

  function goToPreviousMonth() {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  }
    
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();

  return(
  <>
    <h1 className="page-title">Availability Entry</h1>
    <button className="back-btn" onClick={() => navigate("/")}>Back to Home</button>
    <div className="availabilityentry-page">
      <div className="content-wrapper">
        <div className="sidebar">
          <h3>Entered</h3>
          <ul>
            {employees.filter(emp => enteredEmployeeIds.includes(emp.id)).map(emp => (
                <li
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  style={{ fontWeight: selectedEmployee?.id === emp.id ? "bold" : "normal" }}
                >
                {emp.name}
                </li>
            ))}
          </ul>

          <h3>Remaining</h3>
          <ul>
            {employees.filter(emp => !enteredEmployeeIds.includes(emp.id)).map(emp => (
                <li
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  style={{ fontWeight: selectedEmployee?.id === emp.id ? "bold" : "normal" }}
                  >
                  {emp.name}
                </li>
            ))}
          </ul>
        </div>

        <div className="calendar-section">
          <div className="month-nav">
            <button onClick={goToPreviousMonth}>← Previous</button>
            <h3 className="month-year-title">{monthNames[currentMonth.month]} {currentMonth.year}</h3>
            <button onClick={goToNextMonth}>Next →</button>
          </div>
          {selectedEmployee ? (
            <h3 className="editFor-title">Editing availability for: {selectedEmployee.name}</h3>) : (
            <h2>Select an employee from the list</h2>
            )}
          <div className="weekday-headers">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="calendar">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="day-cell empty"></div>
            ))}
            {getDaysInMonth(currentMonth.year, currentMonth.month).map(date => (
              <div key={date} className="day-cell">
                <div className="day-number">{date.slice(-2)}</div>
                {["morning", "noon", "night"].map(shift => (
                  <div
                    key={shift}
                    onClick={() => toggleAvailability(date, shift)}
                    style={{ background: availabilitySelections[`${date}_${shift}`] ? "lightgreen" : "lightgray" }}
                  >
                    {shift}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {selectedEmployee && (
            <button onClick={handleSaveAvailability} className="save-btn">
              Save Availability
              </button>
          )}
        </div>
      </div>
    </div>
  </>
);
}

