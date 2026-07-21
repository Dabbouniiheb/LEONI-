const {
  BUSINESS_TIMEZONE,
  PLANNING_GENERATION_ERROR_CODES,
  VALIDATION_RULES,
} = require("../config/constants");
const { BadRequestError, ForbiddenError, withErrorCode } = require("./errors");

const WINDOW_CLOSED_MESSAGE =
  "Home Office planning can only be generated from the 25th until the end of the month.";
const INVALID_MONTH_MESSAGE =
  "Planning can only be generated for the immediately following month.";

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getBusinessDateParts(utcInstant, timezone = BUSINESS_TIMEZONE) {
  const instant = utcInstant instanceof Date ? utcInstant : new Date(utcInstant);
  if (Number.isNaN(instant.getTime())) {
    throw new Error("Invalid authoritative UTC timestamp");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getLastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getNextMonth(year, month) {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}

function buildPlanningGenerationWindow(utcInstant, timezone = BUSINESS_TIMEZONE) {
  const { year, month, day } = getBusinessDateParts(utcInstant, timezone);
  const monthKey = `${year}-${padNumber(month)}`;
  const lastDay = getLastDayOfMonth(year, month);
  const isOpen = day >= VALIDATION_RULES.PLANNING_WINDOW_DAY && day <= lastDay;
  const nextMonth = getNextMonth(year, month);

  return {
    server_date: `${monthKey}-${padNumber(day)}`,
    timezone,
    is_open: isOpen,
    current_month: monthKey,
    allowed_month: isOpen ? `${nextMonth.year}-${padNumber(nextMonth.month)}` : null,
    opens_on: `${monthKey}-${padNumber(VALIDATION_RULES.PLANNING_WINDOW_DAY)}`,
    closes_on: `${monthKey}-${padNumber(lastDay)}`,
  };
}

function getTargetMonthContext(window) {
  const allowedMonth = String(window?.allowed_month || "");
  const currentMonth = String(window?.current_month || "");
  const isNextMonth = Boolean(
    window?.is_open && VALIDATION_RULES.MONTH_KEY_REGEX.test(allowedMonth)
  );

  return {
    monthKey: isNextMonth ? allowedMonth : currentMonth,
    isNextMonth,
  };
}

function validatePlanningGenerationWindow(requestedMonth, window) {
  if (!window?.is_open || !window.allowed_month) {
    throw withErrorCode(
      new ForbiddenError(WINDOW_CLOSED_MESSAGE),
      PLANNING_GENERATION_ERROR_CODES.WINDOW_CLOSED
    );
  }

  const monthKey = String(requestedMonth || "").trim();
  if (
    !VALIDATION_RULES.MONTH_KEY_REGEX.test(monthKey) ||
    monthKey !== window.allowed_month
  ) {
    throw withErrorCode(
      new BadRequestError(INVALID_MONTH_MESSAGE),
      PLANNING_GENERATION_ERROR_CODES.INVALID_MONTH
    );
  }

  return window.allowed_month;
}

module.exports = {
  buildPlanningGenerationWindow,
  getTargetMonthContext,
  validatePlanningGenerationWindow,
};
