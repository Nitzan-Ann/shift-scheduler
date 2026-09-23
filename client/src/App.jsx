import { useState } from "react";
import Home from "./Home";
import EmployeeManagement from "./EmployeeManagement";
import AvailabilityEntry from "./AvailabilityEntry";
import ProposedSchedule from "./ProposedSchedule";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/availability" element={<AvailabilityEntry />} />
        <Route path="/schedule" element={<ProposedSchedule />} />
      </Routes>
    </BrowserRouter>
  );
}