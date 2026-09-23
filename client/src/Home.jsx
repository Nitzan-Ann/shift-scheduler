import "./Home.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
    const navigate = useNavigate();
    const [hasPendingSchedule, setHasPendingSchedule] = useState(false);

    async function loadPendingSchedule(){
        try {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
            
            const from = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
            const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
            
            const res = await fetch(`http://localhost:8000/api/schedule?from=${from}&to=${to}`);
            if (!res.ok) return;
            
            const data = await res.json();
            setHasPendingSchedule(data.some(item => item.shift.status === "proposed"));
        
        } catch (err) {
            console.error("Error checking schedule:", err);
        }
    }

    useEffect(() => {
        loadPendingSchedule();
    }, []);
    

    return (
        <div className="home">
            <h1 className="home-title">Shift Scheduler</h1>
            <p className="home-subtitle">Manage your team's schedule with ease</p>
            <div className="home-bar">
                <button className="home-btn" onClick={() => navigate("/employees")}>Employee Management</button>
                <button className="home-btn" onClick={() => navigate("/availability")}>Availability Entry</button>
                <button className="home-btn" onClick={() => navigate("/schedule")}>Proposed Schedule</button>
            </div>
            <div className="home-PendingSchedule">
                {hasPendingSchedule && (
                    <div className="pending-notice" onClick={() => navigate("/schedule")}>
                        📋 There's a proposed schedule waiting for approval
                    </div>
                )}
            </div>
        </div>
    );
}