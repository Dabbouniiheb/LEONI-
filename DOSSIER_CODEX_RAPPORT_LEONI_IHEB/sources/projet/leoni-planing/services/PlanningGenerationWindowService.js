const Planning = require("../models/Planning");
const {
  buildPlanningGenerationWindow,
  validatePlanningGenerationWindow,
} = require("../utils/planningGenerationWindow");

class PlanningGenerationWindowService {
  static async getPlanningGenerationWindow(connection) {
    const clock = await Planning.getAuthoritativeUtcClock(connection);
    return buildPlanningGenerationWindow(clock.utc_now);
  }

  static validatePlanningGenerationWindow(requestedMonth, window) {
    return validatePlanningGenerationWindow(requestedMonth, window);
  }
}

module.exports = PlanningGenerationWindowService;
