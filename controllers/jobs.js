const Job = require("../models/Job");

const flashMongooseValidationErrors = (req, err) => {
  
  if (err && err.name === "ValidationError" && err.errors) {
    Object.values(err.errors).forEach((e) => req.flash("error", e.message));
    return true;
  }
  return false;
};

// GET /jobs
exports.getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.render("jobs", { jobs });
};

// GET /jobs/new
exports.showNewJob = (req, res) => {
  res.render("job", { job: null });
};

// POST /jobs
exports.createJob = async (req, res) => {
  try {
    await Job.create({
      company: req.body.company,
      position: req.body.position,
      status: req.body.status || "pending",
      createdBy: req.user._id,
    });

    req.flash("info", "Job created.");
    res.redirect("/jobs");
  } catch (err) {
    if (!flashMongooseValidationErrors(req, err)) {
      req.flash("error", "Unable to create job.");
    }

    res.render("job", {
      job: {
        company: req.body.company,
        position: req.body.position,
        status: req.body.status || "pending",
      },
    });
  }
};

// GET /jobs/edit/:id
exports.showEditJob = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  res.render("job", { job });
};

// POST /jobs/update/:id
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }

    job.company = req.body.company;
    job.position = req.body.position;
    job.status = req.body.status || "pending";
    await job.save();

    req.flash("info", "Job updated.");
    res.redirect("/jobs");
  } catch (err) {
    if (!flashMongooseValidationErrors(req, err)) {
      req.flash("error", "Unable to update job.");
    }

    res.render("job", {
      job: {
        _id: req.params.id,
        company: req.body.company,
        position: req.body.position,
        status: req.body.status || "pending",
      },
    });
  }
};

// POST /jobs/delete/:id
exports.deleteJob = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  await job.deleteOne();
  req.flash("info", "Job deleted.");
  res.redirect("/jobs");
};