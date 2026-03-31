const reportSummary = require("./kinds/reportSummary");
const yearComparison = require("./kinds/yearComparison");
const trends = require("./kinds/trends");
const anomalies = require("./kinds/anomalies");
const dataExplanation = require("./kinds/dataExplanation");
const insights = require("./kinds/insights");
const general = require("./kinds/general");

/** סדר יציב — תואם מפרט skills_system_prompt */
const SKILL_MODULES = [
  reportSummary,
  yearComparison,
  trends,
  anomalies,
  dataExplanation,
  insights,
  general,
];

const BY_CATEGORY = new Map(
  SKILL_MODULES.map((m) => [m.chatCategory, m]),
);

/**
 * @param {string} chatCategory מ־classifyChatCategoryWithConfidence
 * @returns {{ id: string, chatCategory: string }}
 */
function skillModuleForChatCategory(chatCategory) {
  return BY_CATEGORY.get(chatCategory) || general;
}

module.exports = {
  SKILL_MODULES,
  skillModuleForChatCategory,
};
