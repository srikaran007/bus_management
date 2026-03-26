const resolveInstitution = (req) => req.user?.institution || null;

const institutionFilter = (req) => {
  const institution = resolveInstitution(req);
  return institution ? { institution } : {};
};

const withInstitution = (req, payload = {}) => {
  const institution = resolveInstitution(req);
  return institution ? { ...payload, institution } : { ...payload };
};

const canAccessInstitutionRecord = (req, record) => {
  const institution = resolveInstitution(req);
  if (!institution) return true;
  return String(record?.institution || "") === institution;
};

module.exports = {
  resolveInstitution,
  institutionFilter,
  withInstitution,
  canAccessInstitutionRecord
};
