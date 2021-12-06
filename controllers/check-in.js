const Checkin = require("../models/checkin");
const Timesheet = require("../models/timesheet");

var moment = require("moment-business-days");

moment.updateLocale("vn", {
    workingWeekdays: [1, 2, 3, 4, 5],
    holidayFormat: "YYYY-MM-DD",
  });

  exports.getCheckIn = (req, res, next) => {
    const Staff = req.staff;
    let isCheckedIn = false;
    let notLeave = req.query.notLeave;
    let noTimesheet = req.query.noTimesheet;
    let overLeave = req.query.overLeave;
    let holiday = req.query.holiday;
  
    Checkin.find({ staffId: req.staff._id, end: null })
      .then((checkin) => {
        let Checkin;
        if (checkin.length > 0) {
          // do not show checkin form if already checked in and not check out yet
          isCheckedIn = true;
          Checkin = checkin[0];
        }
        res.render("check-in", {
          staff: Staff,
          docTitle: 'Điểm danh',
          path: "/",
          isCheckedIn: isCheckedIn,
          notLeave: notLeave,
          noTimesheet: noTimesheet,
          overLeave: overLeave,
          checkin: Checkin,
          holiday: holiday,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  exports.postCheckIn = (req, res, next) => {
    Checkin.find({ staffId: req.staff._id, end: null }).then((c) => {
      if (c.length > 0) {
        let existingCheckin = c[0];
        const checkout_time = new Date();
        existingCheckin.end = checkout_time;
        // console.log(existingCheckin.date );
        let hourWork = checkout_time.getHours() + checkout_time.getMinutes() / 60 
                  - (existingCheckin.start.getHours() +
                    existingCheckin.start.getMinutes() / 60);
  
        existingCheckin.hour = Math.round(hourWork * 100) / 100;
  
        existingCheckin
          .save()
          .then((results) => {
            // console.log(results);
            Checkin.aggregate(
              [
                { $match: { staffId: req.staff._id } },
                {
                  $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$start" } },//workday
                    totalHours: {
                      $sum: "$hour",
                    },
                  },
                },
                { $sort: { _id: -1 } },
              ],
              //collection temporary
              function (err, results) {
                // console.log(results);
                if (err) {
                  console.log(err);
                } else {
                  let forRenderTimesheet;
                  time = results.map((i) => {
                    const date = i._id ;
                    
                    let totalHours, overTime;
  
                    // check  business day 
                    if (moment(i._id, "YYYY-MM-DD").isBusinessDay()) {
                      totalHours = i.totalHours;
                      console.log(totalHours);
                      overTime = totalHours > 8 ? totalHours - 8 : 0;
                    } else {
                      totalHours = 0;
                      overTime = 0 ;
                    }
                    console.log(date);
                    return Checkin.find({ date: date }) // have to return in able to handle as a promise
                      .then((checkin) => {
                        console.log(checkin);
                        return {
                          _id: date,
                          checkin: checkin,
                          totalHours: totalHours,
                          overTime: overTime,
                        };
                      });
                  });
  
                  Promise.all(time).then(function (results) {
                    forRenderTimesheet = results;
  
                    // find && update timesheet for staff
                    Timesheet.find({ staffId: req.staff._id }).then((t) => {
                      // create temporary timesheet to get info
                      const timesheet = new Timesheet({
                        staffId: req.staff._id,
                        timesheet: [],
                      });
  
                      // add checkin info to timesheet
                      forRenderTimesheet.forEach((i) => {
                        let hours =
                          i.totalHours == 0 ? 0 : i.totalHours - i.overTime;
                        timesheet.timesheet.push({
                          _id: i._id,
                          checkin: [...i.checkin],
                          totalHours: i.totalHours,
                          overTime: i.overTime,
                          hours: hours,
                        });
                      });
  
                      // if already have a timesheet
                      if (t.length > 0) {
                        let existingTimesheet = t[0];
                        existingTimesheet.timesheet = timesheet.timesheet;
                        existingTimesheet.save().then((results) => {
                          res.redirect("/");
                        });
                      } else {
                        timesheet.save().then((results) => {
                          res.redirect("/");
                        });
                      }
                    });
                  });
                }
              }
            );
          })
          .catch((err) => {
            console.log("post checkin failed: " + err);
          });
      } else {
        let checkin = new Checkin();
        const workplace = req.body.workplace;
        const currentTime = new Date();
        const date = currentTime.getFullYear() +
                    "-" + (currentTime.getMonth() + 1) +
                    "-" + (currentTime.getDate() < 10 ? ('0' + currentTime.getDate()) : currentTime.getDate()  );
  
        checkin.workplace = workplace;
        checkin.start = currentTime;
        checkin.date = date;
        checkin.staffId = req.staff._id;
        checkin
          .save()
          .then((results) => {
            // console.log(results);
            res.redirect("/");
          })
          .catch((err) => {
            console.log("post checkin failed: " + err);
          });
      }
    });
  };
