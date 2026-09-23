import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma.js';
import { solveSchedule } from './schedule.js';

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post('/api/employees', async (req, res) => {
  try {
    const { name, seniority, isShiftLead } = req.body;
    const employee = await prisma.employee.create({
      data: { name, seniority, isShiftLead },
    });

    res.status(201).json(employee);

  } catch (err) {
    console.error("POST /api/employees", err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

app.get('/api/employees', async (req, res) => {
    try {
        const { includeInactive } = req.query;
        const where = includeInactive === 'true' ? {} : { isActive: true };

        const employees = await prisma.employee.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        res.json(employees);
    }
    catch (err) {
        console.error("GET /api/employees", err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

app.get('/api/employees/:id', async (req, res) => {
    try {
        const numericId = Number(req.params.id)
        const employee = await prisma.employee.findUnique({
            where: { id: numericId },
            include: {
                assignments: {
                    include: {
                        shift: true
                    }
                }
            }
        });

        if (!employee) return res.status(404).json({ error: "Employee not found" });

        return res.status(200).json(employee);

    } catch (err) {
        console.error("GET /api/employees/:id", err);
        return res.status(500).json({ error: "Failed to get Employee" });
    }
});

app.post('/api/employees/:id/availability', async (req, res) => {
    try {
        const numericId = Number(req.params.id)
        const { availability, from, to } = req.body;

        const fromDate = new Date(from);
        const toDate = new Date(to);

        await prisma.availability.deleteMany({
            where: {
                employeeId: numericId,
                date: { gte: fromDate, lte: toDate }
            }
        });
        
        const dataWithEmployeeId = availability.map(item => ({ ...item, date: new Date(item.date), employeeId: numericId }));

        const employeeAvailability = await prisma.availability.createMany({
            data: dataWithEmployeeId
    });

    res.status(201).json(employeeAvailability);

       } catch (err) {
    console.error("POST /api/employees/:id/availability", err);
    res.status(500).json({ error: "Failed to save availability" });
  }
});

app.post('/api/schedule/generate', async (req, res) => {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

  try {
    const employees = await prisma.employee.findMany();
    const availability = await prisma.availability.findMany({
        where: {
            date: { gte: fromDate, lte: toDate }
        }
    });

    const existingShiftsCount = await prisma.shift.count({
        where: { date: { gte: fromDate, lte: toDate } }
    });
    
    if (existingShiftsCount === 0) {
        const shiftsToCreate = [];
        const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
        const dateForShift = new Date(currentDate);
        shiftsToCreate.push({
            date: dateForShift,
            shiftType: "morning",
            requiredCount: (dateForShift.getDay() === 5 || dateForShift.getDay() === 6) ? 2 : 3
        });
        shiftsToCreate.push({ date: dateForShift, shiftType: "noon", requiredCount: 2 });
        shiftsToCreate.push({ date: dateForShift, shiftType: "night", requiredCount: 2 });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    await prisma.shift.createMany({ data: shiftsToCreate });
    }

    const shifts = await prisma.shift.findMany({
        where: {
            date: { gte: fromDate, lte: toDate }
        }
    });
    const availabilityFixed = availability.map(a => ({ ...a, date: a.date.toISOString().slice(0, 10) }))
    const shiftsFixed = shifts.map(a => ({ ...a, date: a.date.toISOString().slice(0, 10) }))

    const schedule = solveSchedule(employees, availabilityFixed, shiftsFixed);

    await prisma.assignment.deleteMany({
        where: { shift: { date: { gte: fromDate, lte: toDate } } }
    });

    const updatePromises = schedule.map(item =>
        prisma.shift.update({
            where: { id: item.shift.id },
            data: { isFullyStaffed: item.isFullyStaffed }
        })
    );
    await Promise.all(updatePromises);
    
    const assignmentsData = [];
    for (const item of schedule) {
        for (const emp of item.employees) {
            assignmentsData.push({ employeeId: emp.id, shiftId: item.shift.id });
        }
    }
    await prisma.assignment.createMany({ data: assignmentsData });
    res.json({ schedule });


  } catch (err) {
    console.error("POST /api/schedule/generate", err);
    res.status(500).json({ error: 'Failed to make schedule' });
  }
});

app.patch('/api/schedule/assignment/:id', async (req, res) => {
    try {
        const numericId = Number(req.params.id)
        const { newEmployeeId } = req.body;
        const updatedAssignment =await prisma.assignment.update({
        where: { id: numericId },
        data: { employeeId: newEmployeeId }
        });
        res.json({ updatedAssignment });

        } catch (err) {
            console.error("PATCH /api/schedule/assignment/:id", err);
            res.status(500).json({ error: 'Failed to update assignment' });
        }
    });

app.get('/api/schedule', async (req, res) => {
        const { from, to } = req.query;
        const fromDate = new Date(from);
        const toDate = new Date(to);
    try {
        const schedule = await prisma.assignment.findMany({
            where: {
                shift: {
                    date: { gte: fromDate, lte: toDate }
                }
            },
            include: {
                employee: true,
                shift: true
            }
        });

        return res.status(200).json(schedule);

    } catch (err) {
        console.error("GET /api/schedule", err);
        return res.status(500).json({ error: "Failed to get Schedule" });
    }
});

app.post('/api/schedule/confirm', async (req, res) => {
        const { from, to, status } = req.query;
        const fromDate = new Date(from);
        const toDate = new Date(to);
    try {
        const scheduleConfirm = await prisma.shift.updateMany({
            where: {date: { gte: fromDate, lte: toDate } },
            data: { status: status }
        });

        return res.status(200).json(scheduleConfirm);

    } catch (err) {
        console.error("POST /api/schedule/confirm", err);
        return res.status(500).json({ error: "Failed to confirm" });
    }
});

app.get('/api/availability', async (req, res) => {
        const { from, to } = req.query;
        const fromDate = new Date(from);
        const toDate = new Date(to);
    try {
        const availabilityInDates = await prisma.availability.findMany({
            where: {
                date: { gte: fromDate, lte: toDate }
            },
            include: { employee: true,

            }
        });

        return res.status(200).json(availabilityInDates);

    } catch (err) {
        console.error("GET /api/availability", err);
        return res.status(500).json({ error: "Failed to get availability" });
    }
});

app.patch('/api/employees/:id', async (req, res) => {
    try {
        const numericId = Number(req.params.id)
        const updatedEmployee =await prisma.employee.update({
        where: { id: numericId },
        data: req.body
        });
        res.json({ updatedEmployee });

        } catch (err) {
            console.error("PATCH /api/employees/:id", err);
            res.status(500).json({ error: 'Failed to update employee' });
        }
    });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});