const url = require("url");

const Checkin = require("../models/checkin");
const Dayoff = require("../models/dayoff");
const Timesheet = require("../models/timesheet");
const Staff = require("../models/staff");
const Confirm = require("../models/confirm");

const fileHelper = require("../util/file");

const fs = require("fs");
const path = require("path");
const pdfDocument = require("pdfkit");
var mongoose = require('mongoose');

// use moment-business-days to check holiday
var moment = require("moment-business-days");

moment.updateLocale("vn", {
  workingWeekdays: [1, 2, 3, 4, 5, 6],
  holidayFormat: "YYYY-MM-DD",
});



// get employee list
exports.getEmployeeTimesheet = (req, res, next) => {
    Staff.find(
      {
        _id: { $in: req.staff.employee },
      },
      function (err, docs) {
        res.render("employeeTimesheet", {
          staff: req.staff,
          docTitle: "Tra giờ của nhân viên",
          path: "/employeeTimesheet",
          employees: docs,
          isAuthenticated: req.session.isLoggedIn,
          isManager: req.staff.manager,
        });
      }
    );
  };
  
  exports.getEmployeeTimesheetWithId = (req, res, next) => {
    const ITEMS_PER_PAGE = 2;
    const employeeId = req.params.employeeId;
    let managerName = req.staff.name;
  
    if (!employeeId) {
      return res.redirect('/employeeTimesheet')
    } else {
      Staff.findById(employeeId)
        .then((employee) => {
          if (!employee) {
            return res.redirect('/employeeTimesheet')
          }
          const page = +req.query.page || 1;
  
          if (employee.managerId.toString() !== req.staff._id.toString()) {
            const error = new Error("Unauthorized.");
            res.httpStatusCode = 500;
            return next(error);
          }
  
          Checkin.countDocuments({
            end: { $ne: null },
            staffId: employeeId,
          }).then((sum) => {
            const numberToSkip = (page - 1) * ITEMS_PER_PAGE;
            const totalCheckins = sum;
            Timesheet.find(
              { staffId: employeeId },
              { timesheet: { $slice: [numberToSkip, ITEMS_PER_PAGE] } }
            ).then((timesheet) => {
              if (!timesheet) {
                const error = new Error("No timesheet.");
                res.httpStatusCode = 500;
                return next(error);
              }
              res.render("timesheet-employeeId", {
                staff: employee,
                managerName: managerName,
                docTitle: "Tra cứu giờ làm nhân viên",
                path: `/employeeTimmsheet/`,
                timesheet: timesheet[0].timesheet,
                months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                noInfo: false,
                isAuthenticated: req.session.isLoggedIn,
                totalCheckins: totalCheckins,
                currentPage: page,
                hasNextPage: totalCheckins > page * ITEMS_PER_PAGE,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalCheckins / ITEMS_PER_PAGE),
                isManager: req.staff.manager,
                notMonth: true,
                pageNum : 1
              });
            });
          });
        })
        .catch((err) => {
          const error = new Error("Error occurred.");
          res.httpStatusCode = 500;
          return next(error);
        });
    }
  };
  
  // get timesheet by month
exports.postEmployeeTimesheetWithId = (req, res, next) => {
    const employeeId = req.body.staffId;
    const managerName = req.staff.name;
    const month = req.body.month;
  
    Staff.findById(employeeId)
      .then((employee) => {
        let e = employee;
        Timesheet.find({ staffId: employeeId }).then((t) => {
          if (t.length > 0) {
            const timesheet = t[0];
  
            // get the array of months & values
            let result = timesheet.timesheet.reduce(function (t, a) {
              t[a._id.slice(5, 7)] = t[a._id.slice(5, 7)] || [];
              t[a._id.slice(5, 7)].push(a);
              return t;
            }, Object.create(null));
  
            const found = Object.entries(result).find(
              ([key, value]) => key === month
            );
            
            if (!found) {
              return res.redirect(`/employeeTimesheet/${employeeId}`);
            }
  
            let mTimesheet;
            for (const [key, value] of Object.entries(found)) {
              mTimesheet = value;
            }
            // sort timesheet by date desc
            mTimesheet.sort(
              (a, b) => (a._id.slice(0, 10) > b._id.slice(0, 10) && -1) || 1
            );
  
            res.render("timesheet-employeeId", {
              staff: e,
              managerName: managerName,
              docTitle: "Tra cứu giờ làm",
              path: "/employeeTimesheet",
              timesheet: mTimesheet,
              months: [1,2,3,4,5,6,7,8,9,10,11,12],
              noInfo: false,
              isAuthenticated: req.session.isLoggedIn,
              isManager: req.staff.manager,
              notMonth: false,
              month: month,
            });
          } else {
            res.redirect(
              url.format({
                pathname: "/",
                query: {
                  noTimesheet: true,
                },
              })
            );
          }
        });
      })
  
      .catch((err) => {
        console.log(err)
        // const error = new Error("Error occurred.");
        // res.httpStatusCode = 500;
        // return next(error);
      });
  };
  
  // delete checkin
exports.postDeleteCheckin = (req, res, next) => {
    const checkinId = req.body.checkinId;
    const employeeId = req.body.employeeId;
  
    Checkin.findById(checkinId)
      .then((checkin) => {
        Timesheet.find({ staffId: employeeId }).then((t) => {
          let timesheet = t[0];
          let index1;
          let index2;
  
          timesheet.timesheet.forEach((i, indexA) => {
            i.checkin.forEach((c, indexB) => {
              if (c._id.toString() === checkinId.toString()) {
                index1 = indexA;
                index2 = indexB;
              }
            });
          });
  
          timesheet.timesheet[index1].checkin.splice(index2, 1);
          if (timesheet.timesheet[index1].totalHours - checkin.hour < 0) {
            timesheet.timesheet.splice(index1, 1);
          } else {
            timesheet.timesheet[index1].totalHours =
              timesheet.timesheet[index1].totalHours - checkin.hour;
            timesheet.timesheet[index1].hours =
              timesheet.timesheet[index1].totalHours -
              timesheet.timesheet[index1].overTime;
            // timesheet.timesheet[index1].overTime = timesheet.timesheet[index1].overTime - checkin.overTime;
          }
  
          timesheet.save().then((results) => {
            Checkin.findByIdAndDelete(checkinId).then((results) => {
              res.redirect(`/employeeTimesheet/${employeeId}`);
            });
          });
        });
      })
      .catch((err) => {
        const error = new Error("Error occurred.");
        res.httpStatusCode = 500;
        return next(error);
      });
  };
  
  // get employee list
exports.getEmployeeVaccine = (req, res, next) => {
    Staff.find(
      {
        _id: { $in: req.staff.employee },
      },
      function (err, docs) {
        res.render("employeeVaccine", {
          staff: req.staff,
          docTitle: "Thông tin covid của nhân viên",
          path: "/employeeVaccine",
          employees: docs,
          isAuthenticated: req.session.isLoggedIn,
          isManager: req.staff.manager,
        });
      }
    );
  };
  
  // get vaccine info of employee
exports.getEmployeeVaccineWithId = (req, res, next) => {
    const employeeId = req.params.employeeId;
  
    if (!employeeId) {
      return res.redirect('/employeeVaccine')
    } else {
      Staff.findById(employeeId)
        .then((employee) => {
          if (!employee) {
            return res.redirect("/employeeVaccine");
          }
  
          if (employee.managerId.toString() !== req.staff._id.toString()) {
            return res.redirect("/");
          }
  
          res.render("employeeVaccineWithId", {
            staff: employee,
            docTitle: "Thông tin covid của nhân viên",
            path: "/employeeVaccine",
            isManager: req.staff.manager,
          });
        })
        .catch((err) => {
          const error = new Error("Error occurred.");
          res.httpStatusCode = 500;
          return next(error);
        });
    }
  };
  
  // get pdf file of vaccine info
exports.getVaccinePdf = (req, res, next) => {
    const employeeId = req.params.employeeId;
  
    if (!employeeId) {
      res.redirect('employeeVaccine')
    } else {
      Staff.findById(employeeId)
      .then((staff) => {
        if (!staff) {
          res.redirect('employeeVaccine')
        }
        if (staff.managerId.toString() !== req.staff._id.toString()) {
          const error = new Error("Unauthorized");
          res.httpStatusCode = 500;
          return next(error);
        }
  
        const pdfName = "VaccineInfo-" + staff.name + ".pdf";
        const pdfPath = path.join("data", "pdf", pdfName);
  
        const pdfDoc = new pdfDocument();
  
  
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + pdfName + '"'
        );
        const nameEmployee = staff.name;
        const result = staff.covid.result ? staff.covid.result : "N/a";
        const tem = staff.covid.tem ? staff.covid.tem : "N/a";
        const vaccine1 = staff.covid.vaccine[0]
          ? staff.covid.vaccine[0]["shot"]
          : "N/a";
        const date1 = staff.covid.vaccine[0]
          ? staff.covid.vaccine[0]["date"].toISOString().slice(0, 10)
          : "N/a";
        const vaccine2 = staff.covid.vaccine[1]
          ? staff.covid.vaccine[1]["shot"]
          : "N/a";
        const date2 = staff.covid.vaccine[1]
          ? staff.covid.vaccine[1]["date"].toISOString().slice(0, 10)
          : "N/a";
  
        pdfDoc.pipe(fs.createWriteStream(pdfPath));
        pdfDoc.pipe(res);
  
        pdfDoc.fontSize(24).text("Vaccine Infor" + ' : '+nameEmployee, {
          underline: true,
        });
        pdfDoc.text("----------------------");
  
        pdfDoc.fontSize(18).text("Test results: " + result);
        pdfDoc.fontSize(18).text("temperature: " + tem);
        pdfDoc.fontSize(18).text("Type shot 1: " + vaccine1);
        pdfDoc.fontSize(18).text("day of shot 1: " + date1);
        pdfDoc.fontSize(18).text("Type shot 2: " + vaccine2);
        pdfDoc.fontSize(18).text("day of shot 2: " + date2);
  
        pdfDoc.text("-------");
  
        pdfDoc.end();
      })
      .catch((err) => {
        const error = new Error("Error occurred.");
        res.httpStatusCode = 500;
        return next(error);
      });
    }
  };
  
  // confirm checkin
exports.postEmployeeTimesheetConfirm = (req, res, next) => {
    const month = req.body.month_confirm;
    const employeeId = req.body.staffId_confirm;
    let updateCheckinList = [];
  
    Timesheet.find({ staffId: employeeId })
      .then((t) => {
        let timesheet = t[0];
  
        let result = timesheet.timesheet.reduce(function (t, a) {
          t[a._id.slice(5, 7)] = t[a._id.slice(5, 7)] || [];
          t[a._id.slice(5, 7)].push(a);
          return t;
        }, Object.create(null));
  
        // find the value of the selected month
        const found = Object.entries(result).find(
          ([key, value]) => key === month
        );
  
        let nTimesheet;
  
        for (const [key, value] of Object.entries(found)) {
          nTimesheet = value;
        }
  
        nTimesheet.forEach((nt) => {
          nt.checkin.forEach((c) => {
            updateCheckinList.push(c._id);
          });
        });
        
        Checkin.find(
          {
            _id: { $in: updateCheckinList },
          },
          function (err, checkins) {
            const abc = checkins.map((checkin) => {
              checkin.confirm = true;
              return checkin.save();
            });
            Promise.all(abc).then(function (r) {
              timesheet.timesheet.forEach((t) => {
                t.checkin.forEach((c) => {
                  if (updateCheckinList.includes(c._id)) {
                    c.confirm = true;
                  }
                });
              });
  
              // create new confirm doc for confirmed checkins
              const confirmedCheckinList = updateCheckinList.map(c => {
                return { _id: c }
              })
  
              const confirm = new Confirm({
                month: month,
                staffId: new mongoose.Types.ObjectId(employeeId),
                checkins: confirmedCheckinList
              })
  
              confirm.save()
              .then((results) => {
                timesheet.save().then((results) => {
                  res.redirect("/employeeTimesheet");
                });
              })
            });
          }
        );
      })
      .catch((err) => {
        const error = new Error("Error occurred.");
        res.httpStatusCode = 500;
        return next(error);
      });
  };
  