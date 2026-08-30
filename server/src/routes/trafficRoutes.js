const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');

router.post('/reading', trafficController.ingestReading);
router.get('/history/:id', trafficController.getHistory);
router.get('/aggregate', trafficController.getAggregateStats);

module.exports = router;
