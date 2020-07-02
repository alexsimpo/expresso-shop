const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheet.js');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, 
    {
        $employeeId: employeeId
    }, 
    (error, employee) => {
        if (error) {
            next(error);
        } else if (employee) {
            req.employee = employee;
            next();
        } else {
            res.sendStatus(404);            
        }
    });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`,
    (error, employees) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json({ employees: employees })
        }
    })
});

employeesRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    
    if(!name || !position || !wage) {
        return res.sendStatus(400);
    }

    const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
    VALUES ($name, $position, $wage, $isCurrentEmployee)`;

    const values = {
        $name: name, 
        $position: position, 
        $wage: wage, 
        $isCurrentEmployee: isCurrentEmployee
    }

    db.run(sql, values,
    function(error) {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, 
            (error, employee) => {
                res.status(201).json({ employee: employee });
            });
        }
    });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({ employee: req.employee });
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    
    if(!name || !position || !wage) {
        return res.sendStatus(400);
    }
    
    const values = {
        $name: name, 
        $position: position, 
        $wage: wage, 
        $isCurrentEmployee: isCurrentEmployee,
        $employeeId: req.params.employeeId
    }

    const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee
    WHERE Employee.id = $employeeId`;

    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, employee) => {
                res.status(200).json({ employee: employee });
            })
        }
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId`, 
    {
        $employeeId: req.params.employeeId
    }
    ,(error) => {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
            (error, employee) => {
                res.status(200).json({ employee: employee })
            })
        }
    })
});

module.exports = employeesRouter;