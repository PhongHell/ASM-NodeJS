const url = require("url");
const Dayoff = require("../models/dayoff");

var moment = require("moment-business-days");

moment.updateLocale("vn", {
    workingWeekdays: [1, 2, 3, 4, 5],
    holidayFormat: "YYYY-MM-DD",
  });

  // post dayoff info
  exports.postDayoff = (req, res, next) => {
    const reqdayoff = req.body.dayoff + "T00:00:00.000+00:00";
    const houroff = Math.round(req.body.houroff * 100) / 100;
    const reason = req.body.reason;
  
    if (req.staff.annualLeave - houroff < 0) {
      res.redirect(
        url.format({
          pathname: "/",
          query: {
            overLeave: true,
          },
        })
      );
    } else if (!moment(reqdayoff, "YYYY-MM-DD").isBusinessDay()) {
      res.redirect(
        url.format({
          pathname: "/",
          query: {
            holiday: true,
          },
        })
      );
    } else {
      // find && update or create if not existing yet
      Dayoff.find({ staffId: req.staff._id, date: reqdayoff }).then((dayoff) => {
        if (dayoff.length > 0) {
          let existingDayoff = dayoff[0];
          let existingHoursOff = existingDayoff.totalHoursOff;
          let totalHoursOff =
            existingHoursOff + houroff < 8
              ? existingHoursOff + houroff
              : existingHoursOff;
  
          existingDayoff.totalHoursOff = totalHoursOff;
          existingDayoff.reason = reason === '' ? '' : reason;
  
          const notLeave = totalHoursOff !== existingHoursOff + houroff;
  
          existingDayoff.save().then((results) => {
            req.staff.annualLeave =
              totalHoursOff !== existingHoursOff + houroff
                ? req.staff.annualLeave
                : req.staff.annualLeave - totalHoursOff;
  
            req.staff.save().then((results) => {
              res.redirect(
                url.format({
                  pathname: "/",
                  query: {
                    notLeave: notLeave,
                  },
                })
              );
            });
          });
        } else {
          let month = reqdayoff.slice(5, 7);
  
          if (houroff < 8) {
            const newDayoff = new Dayoff({
              staffId: req.staff._id,
              date: reqdayoff,
              month: month,
              totalHoursOff: houroff,
              reason: reason === '' ? '' : reason
            });
            newDayoff.save().then((results) => {
              req.staff.annualLeave = req.staff.annualLeave - houroff;
              req.staff.save().then((results) => {
                res.redirect('/');
              });
            });
          } else {
            res.redirect(
              url.format({
                pathname: "/",
                query: {
                  notLeave: true,
                },
              })
            );
          }
        }
      });
    }
  };