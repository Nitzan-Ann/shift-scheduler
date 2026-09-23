import { useState, useEffect } from "react";
import "./EmployeeManagement.css";
import { useNavigate } from "react-router-dom";

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [name, setName] = useState("");
  const [seniority, setSeniority] = useState("junior");
  const [isShiftLead, setIsShiftLead] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  async function loadEmployees() {
    try {
      const url = showInactive ? "http://localhost:8000/api/employees?includeInactive=true": "http://localhost:8000/api/employees";
      const res = await fetch(url);
      const data = await res.json();
      setEmployees(data);

    } catch (err) {
      console.error("Error loading employees:", err);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [showInactive]);

  async function employeeManagement(e) {
    e.preventDefault();
    if (!name) {
      setError("Please enter employee name");
      return;
    }
    if (!seniority) {
      setError("Please enter your seniority");
      return;
    }
    try {
      setError(null);
      const isEditing = editingId !== null;
      const url = isEditing ? `http://localhost:8000/api/employees/${editingId}`: "http://localhost:8000/api/employees";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, seniority, isShiftLead, isActive  }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Server error");
        return;
      }
      const data = await res.json();
      setSuccess(isEditing ? "Employee updated successfully!" : "Employee created successfully!");
      loadEmployees();
      setName("");
      setSeniority("junior");
      setIsShiftLead(false);
      setEditingId(null);
      setShowForm(false);

    } catch (err) {
      console.error("Error adding employee:", err);
      setError(err.message);
    }
  }

  return (
    <>
    <h1 className="page-title">Employee Management</h1>
    <button className="back-btn" onClick={() => navigate("/")}>Back to Home</button>

    <div className="employeeManagement-page">
      <label>
        Show Inactive Employees
        <input
         type="checkbox"
         checked={showInactive}
         onChange={(e) => setShowInactive(e.target.checked)}
         />
      </label>
      <h3>Employees</h3>
      <div className="content-wrapper">
        <div className="employee-list">
          <ol>
            {employees.map((emp, index) => (
              <li key={emp.id}>
                {index + 1}. {emp.name} - {emp.seniority} {emp.isShiftLead ? "(Shift Lead)" : ""}
                <button className="edit-btn" onClick={() => {
                  setEditingId(emp.id);
                  setName(emp.name);
                  setSeniority(emp.seniority);
                  setIsShiftLead(emp.isShiftLead);
                  setIsActive(emp.isActive);
                  setShowForm(true);
                  setSuccess(null);
                  setError(null);
                }}>Edit</button>
              </li>
            ))}
          </ol>
        </div>
        <div className="employee-form-section">
          {!showForm && (
            <button onClick={() => {
              setShowForm(true);
              setSuccess(null);
              setError(null);
            }}>Add New Employee</button>
            )}
          {showForm && (
            <form onSubmit={employeeManagement}>
              <div className="form-body">
                <label>
                  Employee Name:
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                  />
                </label>
                <label>
                  Seniority:
                  <select value={seniority} onChange={(e) => setSeniority(e.target.value)}>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                  </select>
                </label>
                <label>
                  Shift Lead:
                  <input
                    type="checkbox"
                    checked={isShiftLead}
                    onChange={(e) => setIsShiftLead(e.target.checked)}
                  />
                </label>
                {editingId !== null && (
                  <label>
                    Active:
                    <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    />
                  </label>
                )}
                <div className="form-buttons">
                  <button className="submit-btn" type="submit">
                    {editingId !== null ? "Save Changes" : "Add employee"}
                  </button>
                  <button type="button" onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setName("");
                    setSeniority("junior");
                    setIsShiftLead(false);
                    setIsActive(true);
                    }}>Cancel
                  </button>
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {success && <p style={{ color: "green" }}>{success}</p>}

              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}