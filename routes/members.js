const express = require('express');
const moment = require('moment');

module.exports = (db) => {
    const router = express.Router();

    // Register member
    router.post('/register', (req, res) => {
        const { first_name, last_name, email, phone, emergency_contact, health_conditions, fitness_goals, membership_type, start_date } = req.body;

        const query = `INSERT INTO members (first_name, last_name, email, phone, emergency_contact, health_conditions, fitness_goals, membership_type, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(query, [first_name, last_name, email, phone, emergency_contact, health_conditions, fitness_goals, membership_type, start_date], (err, result) => {
            if (err) {
                console.error('Error adding member:', err);
                return res.status(500).send('Error adding member');
            }
            res.status(200).send('Member added successfully');
        });
    });

    // Get all members with end date
    router.get('/', (req, res) => {
        const query = `
            SELECT *, 
            CASE 
                WHEN membership_type = 'Yearly' THEN DATE_ADD(start_date, INTERVAL 1 YEAR)
                WHEN membership_type = 'Quarterly' THEN DATE_ADD(start_date, INTERVAL 3 MONTH)
                WHEN membership_type = 'Monthly' THEN DATE_ADD(start_date, INTERVAL 1 MONTH)
                ELSE NULL
            END AS end_date 
            FROM members
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching members:', err);
                return res.status(500).send('Error fetching members');
            }
            results = results.map(member => {
                member.start_date = moment(member.start_date).format('YYYY-MM-DD');
                member.end_date = moment(member.end_date).format('YYYY-MM-DD');
                return member;
            });
            res.status(200).json(results);
        });
    });

    // Delete member
    router.delete('/:id', (req, res) => {
        const memberId = req.params.id;
        const query = `DELETE FROM members WHERE id = ?`;
        
        db.query(query, [memberId], (err, result) => {
            if (err) {
                console.error('Error deleting member:', err);
                return res.status(500).send('Error deleting member');
            }
            res.status(200).send('Member deleted successfully');
        });
    });

    return router;
};
