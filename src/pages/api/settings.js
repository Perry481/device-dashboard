// pages/api/settings.js
import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "settings.json");

// Initialize settings with default values if the file doesn't exist
const defaultSettings = {
  offPeakPrices: { 夏月: "NT$1.66", 非夏月: "NT$1.58" },
  peakPrices: { 夏月: "NT$4.02", 非夏月: "NT$3.92" },
  halfPeakPrices: { 夏月: "NT$2.14", 非夏月: "NT$2.06" },
  sortingLogic: [
    {
      condition:
        "(day >= 1 && day <= 5) && isSummer && (hour >= 9 && hour < 24)",
      peakState: "peak",
    },
    {
      condition:
        "(day >= 1 && day <= 5) && isSummer && (hour < 9 || hour >= 24)",
      peakState: "offpeak",
    },
    {
      condition:
        "(day >= 1 && day <= 5) && !isSummer && ((hour >= 6 && hour < 11) || (hour >= 14 && hour < 24))",
      peakState: "peak",
    },
    {
      condition:
        "(day >= 1 && day <= 5) && !isSummer && (hour < 6 || (hour >= 11 && hour < 14))",
      peakState: "offpeak",
    },
    {
      condition: "(day === 6) && isSummer && (hour >= 9 && hour < 24)",
      peakState: "semi-peak",
    },
    {
      condition: "(day === 6) && isSummer && (hour < 9 || hour >= 24)",
      peakState: "offpeak",
    },
    {
      condition:
        "(day === 6) && !isSummer && ((hour >= 6 && hour < 11) || (hour >= 14 && hour < 24))",
      peakState: "semi-peak",
    },
    {
      condition:
        "(day === 6) && !isSummer && (hour < 6 || (hour >= 11 && hour < 14))",
      peakState: "offpeak",
    },
    {
      condition: "(day === 0 || day === 7)",
      peakState: "offpeak",
    },
  ],
};

async function readSettingsFromFile() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const settings = JSON.parse(data);
    // Merge default settings with the read settings
    return { ...defaultSettings, ...settings };
  } catch (error) {
    if (error.code === "ENOENT") {
      // If file does not exist, return default settings
      return defaultSettings;
    }
    throw error;
  }
}

async function writeSettingsToFile(settings) {
  const data = JSON.stringify(settings, null, 2);
  await fs.writeFile(filePath, data, "utf-8");
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const settings = await readSettingsFromFile();
      res.status(200).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to read settings", error });
    }
  } else if (req.method === "POST") {
    try {
      await writeSettingsToFile(req.body);
      res.status(200).json({ message: "Settings saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save settings", error });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
