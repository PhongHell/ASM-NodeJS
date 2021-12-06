exports.get404 = (req, res, next) => {
    res.render("404", { docTitle: "Page not found", path: null });
  }