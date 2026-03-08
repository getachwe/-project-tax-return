function getBearerToken(req) {
  const authHeader =
    req.headers &&
    (req.headers["authorization"] || req.headers["Authorization"]);
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer "))
    return authHeader.slice("Bearer ".length);
  return null;
}

module.exports = { getBearerToken };
