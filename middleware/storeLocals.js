const storeLocals = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.info = req.flash("info");
  res.locals.errors = req.flash("error");

  // host-csrf automatically sets res.locals._csrf
  next();
};

module.exports = storeLocals;