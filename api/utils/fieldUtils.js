function getMissingFields(data, REQUIRED_FIELDS) {
  return REQUIRED_FIELDS.filter(
    (field) =>
      data[field] === undefined || data[field] === null || data[field] === ""
  );
}

module.exports = { getMissingFields };
