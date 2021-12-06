const express = require('express');

const adminController = require('../controllers/admin');
const checkInController = require('../controllers/check-in');
const dayOffController = require('../controllers/day-off');

const router = express.Router();

// get - get edit - post edit staff 
router.get('/staff', adminController.getStaffDetail);

router.get('/edit-staff', adminController.getEditStaff);

router.post('/edit-staff', adminController.postEditStaff);

// get - post edit checkin info
router.get('/', checkInController.getCheckIn);

router.post('/', checkInController.postCheckIn);

// get - post timesheet
router.get('/timesheet', adminController.getTimesheet);
router.post('/timesheet', adminController.postTimesheet);

// get - post covid
router.get('/vaccine', adminController.getVaccine);

router.post('/vaccine', adminController.postVaccine);

// post day off
router.post('/dayoff', dayOffController.postDayoff);

// get salary
router.get('/salary/:month', adminController.getSalary);

module.exports = router;
