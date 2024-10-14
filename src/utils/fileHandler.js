import { promises as fs } from "fs";
import path from "path";

const COMPANY_SETTINGS_DIR = path.resolve(process.cwd(), "company_settings");
const DEFAULT_SETTINGS_DIR = path.resolve(process.cwd(), "default_settings");

export async function getCompanyFile(fileType, companyName) {
  const fileName = `${fileType}.json`;
  const companyDir = path.join(COMPANY_SETTINGS_DIR, companyName);
  const filePath = path.join(companyDir, fileName);

  try {
    await fs.access(companyDir);
  } catch {
    await fs.mkdir(companyDir, { recursive: true });
  }

  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    const defaultFilePath = path.join(
      DEFAULT_SETTINGS_DIR,
      `default_${fileType}.json`
    );
    const newFilePath = path.join(companyDir, fileName);

    try {
      const defaultData = await fs.readFile(defaultFilePath, "utf-8");
      await fs.writeFile(newFilePath, defaultData);
      console.log(`Created new ${fileType} settings for ${companyName}`);
      return newFilePath;
    } catch (error) {
      console.error(
        `Error creating ${fileType} settings for ${companyName}:`,
        error
      );
      throw error;
    }
  }
}

export async function readJSONFile(filePath) {
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export async function writeJSONFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
