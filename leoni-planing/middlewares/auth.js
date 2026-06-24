function wantsJson(req) {
  return (
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.path.startsWith("/api/")
  );
}

function auth(req, res, next) {
  if (!req.session.user) {
    if (wantsJson(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.redirect("/login");
  }
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      if (wantsJson(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.redirect("/login");
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      if (wantsJson(req)) {
        return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
      }
      return res.status(403).send("Forbidden: You do not have permission to access this resource.");
    }
    next();
  };
}

function requireGroup(req, res, next) {
  if (!req.session.user) {
    if (wantsJson(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.redirect("/login");
  }

  if (req.session.user.must_change_password) {
    if (wantsJson(req)) {
      return res.status(403).json({ message: "Password change required", redirect: "/change-password" });
    }
    return res.redirect("/change-password");
  }

  // Only enforce group selection for Data Cleansing staff
  if (req.session.user.role === "Data Cleansing" && (req.session.user.group_id == null || req.session.user.group_id === "")) {
    if (wantsJson(req)) {
      return res.status(403).json({
        message: "Veuillez sélectionner votre groupe Home Office",
        redirect: "/select-group",
      });
    }
    return res.redirect("/select-group");
  }

  next();
}

module.exports = {
  auth,
  requireRole,
  requireGroup,
  wantsJson,
};
