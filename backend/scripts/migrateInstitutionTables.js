const dotenv = require("dotenv");
const { connectDB } = require("../config/db");
const {
  Bus,
  Driver,
  Student,
  Route,
  Attendance,
  EntryExitLog,
  getInstitutionModels
} = require("../models");
const { INSTITUTIONS } = require("../utils/constants");

dotenv.config();

const MODEL_MIGRATIONS = [
  { label: "buses", source: Bus, key: "Bus" },
  { label: "drivers", source: Driver, key: "Driver" },
  { label: "students", source: Student, key: "Student" },
  { label: "routes", source: Route, key: "Route" },
  { label: "attendance", source: Attendance, key: "Attendance" },
  { label: "entry-exit logs", source: EntryExitLog, key: "EntryExitLog" }
];

const sanitizeRow = (row) => {
  const sanitized = { ...row };
  delete sanitized.id;
  delete sanitized._id;
  return sanitized;
};

const migrate = async () => {
  await connectDB();

  for (const institution of INSTITUTIONS) {
    const scopedModels = getInstitutionModels(institution);

    for (const { label, source, key } of MODEL_MIGRATIONS) {
      const target = scopedModels[key];
      const targetCount = await target.count();

      if (targetCount > 0) {
        console.log(`Skipped ${label} for ${institution}: target table already has ${targetCount} rows`);
        continue;
      }

      const rows = await source.findAll({
        where: { institution },
        raw: true
      });

      if (!rows.length) {
        console.log(`Skipped ${label} for ${institution}: no source rows found`);
        continue;
      }

      await target.bulkCreate(rows.map(sanitizeRow));
      console.log(`Migrated ${rows.length} ${label} rows for ${institution}`);
    }
  }

  process.exit(0);
};

migrate().catch((error) => {
  console.error("Institution table migration failed:", error.message);
  process.exit(1);
});
