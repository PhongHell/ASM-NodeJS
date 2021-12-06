const url = require("url");

const Checkin = require("../models/checkin");
const Dayoff = require("../models/dayoff");
const Timesheet = require("../models/timesheet");

// use moment-business-days to check holiday
var moment = require("moment-business-days");


moment.updateLocale("vn", {
  workingWeekdays: [1, 2, 3, 4, 5],
  holidayFormat: "YYYY-MM-DD",
});

// show staff info /
exports.getStaffDetail = (req, res, next) => {
  const Staff = req.staff;
  res.render("staff-detail", {
    staff: Staff,
    docTitle: Staff.name,
    path: "/staff",
  });
};

// get edit page /edit-staff
exports.getEditStaff = (req, res, next) => {
  const Staff = req.staff;
  res.render("edit-staff", {
    staff: Staff,
    docTitle: Staff.name,
    path: "/edit-staff",
  });
};

// post edit /edit-staff
exports.postEditStaff = (req, res, next) => {
  const image = req.body.image;
  const Staff = req.staff;
  Staff.image = image;
  Staff.save()
    .then((results) => {
      res.redirect("/staff");
    })
    .catch((err) => {
      console.log("post edit failed: " + err);
    });
};

// get timesheet
exports.getTimesheet = (req, res, next) => {
  Timesheet.find({ staffId: req.staff._id }).then((t) => {
    if (t.length > 0) {
      const timesheet = t[0];

      // get the array of months & values
      let result = timesheet.timesheet.reduce(function (t, a) {
        t[a._id.slice(5, 7)] = t[a._id.slice(5, 7)] || [];
        t[a._id.slice(5, 7)].push(a);
        return t;
      }, Object.create(null));

      // sort timesheet by date desc
      timesheet.timesheet.sort((a, b) => a._id.slice(0,10) > b._id.slice(0,10) && -1 || 1);

      res.render("timesheet", {
        staff: req.staff,
        docTitle: 'Tra cứu giờ làm',
        path: "/timesheet",
        timesheet : timesheet.timesheet,
        months: result,
        noInfo: false
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
};

// post timesheet
exports.postTimesheet = (req, res, next) => {
  const date = req.body.date;
  console.log(date);
  if (date) {
    Timesheet.find({ staffId: req.staff._id }).then((t) => {
      if (t && t.length > 0) {
        const timesheet = t[0];
  
        // get the array of months & values
        let result = timesheet.timesheet.reduce(function (t, a) {
          t[a._id.slice(5, 7)] = t[a._id.slice(5, 7)] || [];
          t[a._id.slice(5, 7)].push(a);
          return t;
        }, Object.create(null));
  
        // sort timesheet by date desc
        timesheet.timesheet.sort((a, b) => a._id.slice(0,10) > b._id.slice(0,10) && -1 || 1);
  
        // return only search results not whole timesheet.timesheet
        let searchItem;
        if (date && date !== '') {
          searchItem = timesheet.timesheet.filter(t => {
            return t._id.slice(0,10) === date;
          })
        };
  
        res.render("timesheet", {
          staff: req.staff,
          docTitle: 'Tra cứu giờ làm',
          path: "/timesheet",
          timesheet: searchItem.length > 0 ? searchItem : [],
          months: result,
          noInfo: searchItem.length > 0 ? false: true
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
  } else {
    Timesheet.find({ staffId: req.staff._id }).then((t) => {
        const timesheet = t[0];
  
        // get the array of months & values
        let result = timesheet.timesheet.reduce(function (t, a) {
          t[a._id.slice(5, 7)] = t[a._id.slice(5, 7)] || [];
          t[a._id.slice(5, 7)].push(a);
          return t;
        }, Object.create(null));
  
        // sort timesheet by date desc
        timesheet.timesheet.sort((a, b) => a._id.slice(0,10) > b._id.slice(0,10) && -1 || 1);
  
        res.render("timesheet", {
          staff: req.staff,
          docTitle: 'Tra cứu giờ làm',
          path: "/timesheet",
          timesheet : timesheet.timesheet,
          months: result,
          noInfo: false
        });
      })
  }
};

// get covid info form
exports.getVaccine = (req, res, next) => {
  const Staff = req.staff;
  res.render("vaccine", {
    staff: Staff,
    docTitle: 'Thông tin covid',
    path: "/vaccine",
  });
};

// post covid info
exports.postVaccine = (req, res, next) => {
  const tem = req.body.tem;
  const shot1 = req.body.shot1;
  const newDate = new Date();
  const newDate1 = newDate.toISOString().slice(0, 10) + "T00:00:00.000+00:00";

  const date1 = req.body.date1 === "" ? newDate1 : req.body.date1;
  const shot2 = req.body.shot2;
  const date2 = req.body.date2 === "" ? newDate1 : req.body.date2;
  const result = req.body.result;

  const v1 = { shot: shot1, date: date1 };
  const v2 = { shot: shot2, date: date2 };

  req.staff.covid.tem = tem;
  req.staff.covid.date = newDate;
  req.staff.covid.result = result;
  req.staff.covid.vaccine[0] = v1;
  req.staff.covid.vaccine[1] = v2;

  req.staff.save().then((results) => {
    res.redirect("/");
  });
};

// get salary
exports.getSalary = (req, res, next) => {
  const month = req.params.month;
  Timesheet.find({ staffId: req.staff._id }).then((t) => {
    if (t.length > 0) {
      const timesheet = t[0];

      let result = timesheet.timesheet.reduce(function (t, a) {
        t[a._id.slice(5, 7)] = t[a._id.slice(5, 7)] || [];
        t[a._id.slice(5, 7)].push(a);
        return t;
      }, Object.create(null));

      // find the value of the selected month
      const found = Object.entries(result).find(
        ([key, value]) => key === month
      );
       if (found) {
        let overtime = 0;
        let workingDays = [];
        let businessDay;
  
        // get the array of business day
        businessDay = moment("2021-" + month + "-01", "YYYY-MM-DD")
          .monthBusinessDays()
          // .slice(1)
          .map((m) => {
            return m.toString().slice(0, 10);
          });
  
        // find the total overtime
        found[1].forEach((v) => {
          overtime = overtime + v.overTime;
        });
  
        found[1].forEach((v) => {
          // get array of working days in month
          let date = v._id.slice(0, 10);
          let hours = v.hours;
          workingDays.push({
            date: date,
            hours: hours,
          });
        });
  
        // find the array of dayoff
        Dayoff.find({ month: month }).then((d) => {
  
          // create sum for undertime
          let underTime = 0;
          console.log(businessDay.length);
          businessDay.forEach((bd) => {
            underTime = underTime + 8;
            workingDays.forEach((wd) => {
              if (wd.date === bd) {
                underTime = underTime - wd.hours;
                d.forEach((dd) => {
                  if (dd.date.toISOString().slice(0, 10) === bd) {
                    underTime = underTime + dd.totalHoursOff;
                  }
                });
              }
            });
          });
  
          res.render("salary", {
            staff: req.staff,
            docTitle: 'Lương tháng ' + month,
            path: "/salary",
            underTime: Math.round(underTime * 100) / 100,
            overTime: overtime,
            month: month,
          });
        });
       } else {
         // if there is no timesheet info for that month
        res.redirect(
          url.format({
            pathname: "/",
            query: {
              noTimesheet: true,
            },
          })
        );
       }
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
};