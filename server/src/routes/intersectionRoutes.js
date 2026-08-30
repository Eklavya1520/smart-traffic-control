const express = require('express');
const router = express.Router();
const intersectionController = require('../controllers/intersectionController');

router.get('/', intersectionController.getAll);
router.get('/:id', intersectionController.getById);
router.post('/:id/override', intersectionController.overrideSignal);

module.exports = router;
