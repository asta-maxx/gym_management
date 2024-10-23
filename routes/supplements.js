module.exports = (db) => {
    const express = require('express');
    const router = express.Router();

    // Add a supplement
    router.post('/add', (req, res) => {
        const { name, description } = req.body;

        const query = `INSERT INTO supplements (name, description) VALUES (?, ?)`;
        
        db.query(query, [name, description], (err, result) => {
            if (err) {
                console.error('Error adding supplement:', err);
                return res.status(500).send('Error adding supplement');
            }
            res.status(200).send('Supplement added successfully');
        });
    });

    // Get all supplements
    router.get('/', (req, res) => {
        db.query('SELECT * FROM supplements', (err, results) => {
            if (err) {
                console.error('Error fetching supplements:', err);
                return res.status(500).send('Error fetching supplements');
            }
            res.status(200).json(results);
        });
    });

    // Delete supplement
    router.delete('/:id', (req, res) => {
        const supplementId = req.params.id;
        const query = `DELETE FROM supplements WHERE id = ?`;
        
        db.query(query, [supplementId], (err, result) => {
            if (err) {
                console.error('Error deleting supplement:', err);
                return res.status(500).send('Error deleting supplement');
            }
            res.status(200).send('Supplement deleted successfully');
        });
    });

    return router;
};
