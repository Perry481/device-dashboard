// migrate-company-settings.js
const fs = require("fs").promises;
const path = require("path");

const COMPANY_SETTINGS_DIR = path.resolve(process.cwd(), "company_settings");

async function migrateCompanySettings() {
  try {
    const files = await fs.readdir(COMPANY_SETTINGS_DIR);

    for (const file of files) {
      if (file.includes("_")) {
        const [fileType, companyName] = file.split("_");
        const companyDir = path.join(
          COMPANY_SETTINGS_DIR,
          companyName.replace(".json", "")
        );

        // Create company directory if it doesn't exist
        await fs.mkdir(companyDir, { recursive: true });

        // Move and rename the file
        const oldPath = path.join(COMPANY_SETTINGS_DIR, file);
        const newPath = path.join(companyDir, `${fileType}.json`);
        await fs.rename(oldPath, newPath);

        console.log(`Migrated ${file} to ${newPath}`);
      }
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

migrateCompanySettings();
