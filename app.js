const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const path = require("path");

// Routes
const adminRoutes = require("./routes/admin");

// staff model
const Staff = require("./models/staff");

// Controllers
const errorsController = require("./controllers/errors");

// Create app
const app = express();

app.set("view engine", "ejs");//set template string ejs

app.use((req, res, next) => {
  Staff.findById("61a721998af002ead1b09c84")
    .then((staff) => {
      req.staff = staff;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));

app.use(adminRoutes);

app.use("/", errorsController.get404);

mongoose
  .connect(
    "mongodb+srv://ThanhPhong:23lOQy6qMnphokd2@cluster0.n29hy.mongodb.net/StaffApp?retryWrites=true&w=majority"
  )
  .then((results) => {
    app.listen(3000);
    Staff.findOne() // findOne with no argument give back the first one
      .then((staff) => {
        if(!staff) {
            const staff = new Staff({
              name: 'Phong',
              doB: '2000-12-01',
              salaryScale: 1,
              startDate: '2021-11-01',
              department: 'HR',
              annualLeave: 12,
              image: 'https://scontent-sin6-4.xx.fbcdn.net/v/t1.6435-9/123767429_1310202295998318_6181533015101249078_n.jpg?_nc_cat=103&ccb=1-5&_nc_sid=e3f864&_nc_ohc=j52B8zZu_kMAX9q2c-N&_nc_ht=scontent-sin6-4.xx&oh=8820fd11a8f90e95e496174aa18d90e3&oe=61CC685C' 
            });
          staff.save();
        }
      });
  })
  .catch((err) => {
    console.log(err);
  });
