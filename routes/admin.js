const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

// get - get edit - post edit staff info
router.get('/staff', isAuth, adminController.getStaffDetail);

router.get('/edit-staff/:staffId', isAuth, adminController.getEditStaff);

router.post('/edit-staff', isAuth, adminController.postEditStaff);

// get - post edit checkin info
router.get('/', isAuth, adminController.getCheckIn);

router.post('/', isAuth, adminController.postCheckIn);

// get - post timesheet
router.get('/timesheet', isAuth, adminController.getTimesheet);
router.post('/timesheet', isAuth, adminController.postTimesheet);

// get - post covid info
router.get('/vaccine', isAuth, adminController.getVaccine);

router.post('/vaccine', isAuth, adminController.postVaccine);

// post day off
router.post('/dayoff', isAuth, adminController.postDayoff);

// get salary
router.get('/salary/:month', isAuth, adminController.getSalary);

//////////////////////////////////////////////////////////////////////////////////////////

// get employee timesheet
router.get('/employeeTimesheet', isAuth, adminController.getEmployeeTimesheet);
router.get('/employeeTimesheet/:employeeId', isAuth, adminController.getEmployeeTimesheetWithId);

// get timesheet by month
router.post('/employeeTimesheet/month', isAuth, adminController.postEmployeeTimesheetWithId);

// confirm timesheet
router.post('/employeeTimesheet/confirm', isAuth, adminController.postEmployeeTimesheetConfirm);

// delete checkin 
router.post('/employeeTimesheet/delete', isAuth, adminController.postDeleteCheckin);

// get employee covid info
router.get('/employeeVaccine', isAuth, adminController.getEmployeeVaccine);
router.get('/employeeVaccine/:employeeId', isAuth, adminController.getEmployeeVaccineWithId);

// get PDF
router.get('/employeeVaccine/pdf/:employeeId', isAuth, adminController.getVaccinePdf);

module.exports = router;
