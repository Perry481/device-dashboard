// pages/api/settings.js
import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "settings.json");

const defaultSettings = {
  timeRanges: {
    夏月: {
      weekdays: {
        peak: [[9, 24]],
        offpeak: [[0, 9]],
        halfpeak: [],
      },
      saturday: {
        peak: [],
        offpeak: [
          [0, 6],
          [11, 14],
        ],
        halfpeak: [
          [6, 11],
          [14, 24],
        ],
      },
      sunday: {
        offpeak: [[0, 24]],
        peak: [],
        halfpeak: [],
      },
    },
    非夏月: {
      weekdays: {
        peak: [
          [6, 11],
          [14, 24],
        ],
        offpeak: [
          [0, 6],
          [11, 14],
        ],
        halfpeak: [],
      },
      saturday: {
        peak: [],
        offpeak: [
          [0, 6],
          [11, 14],
        ],
        halfpeak: [
          [6, 11],
          [14, 24],
        ],
      },
      sunday: {
        offpeak: [[0, 24]],
        peak: [],
        halfpeak: [],
      },
    },
  },
  CO2: 0.494,
  prices: {
    offPeakPrices: { 夏月: "NT$1.66", 非夏月: "NT$1.58" },
    peakPrices: { 夏月: "NT$4.02", 非夏月: "NT$3.92" },
    halfPeakPrices: { 夏月: "NT$2.14", 非夏月: "NT$2.06" },
  },
};

async function readSettingsFromFile() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const settings = JSON.parse(data);
    return { ...defaultSettings, ...settings };
  } catch (error) {
    if (error.code === "ENOENT") {
      return defaultSettings;
    }
    throw error;
  }
}

async function writeSettingsToFile(settings) {
  const data = JSON.stringify(settings, null, 2);
  await fs.writeFile(filePath, data, "utf-8");
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] instanceof Object && key in target) {
        deepMerge(target[key], source[key]);
      } else {
        // If the value is a number, ensure it's not being manipulated
        target[key] =
          typeof source[key] === "number" ? source[key] : source[key];
      }
    }
  }
  return target;
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
  } else if (req.method === "PATCH") {
    try {
      console.log("Received PATCH request with body:", req.body); // Add this line
      const currentSettings = await readSettingsFromFile();
      const updatedSettings = deepMerge(currentSettings, req.body);
      console.log("Updated settings:", updatedSettings); // Add this line
      await writeSettingsToFile(updatedSettings);
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error in PATCH method:", error); // Modify this line
      res.status(500).json({
        message: "Failed to update settings",
        error: error.toString(),
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
