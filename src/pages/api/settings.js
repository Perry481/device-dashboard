import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "settingsVer2.json");

const defaultSettings = {
  pricingStandards: {
    簡易型時間電價三段式: {
      name: "簡易型時間電價三段式",
      timeRanges: {
        夏月: {
          weekdays: {
            peak: [[16, 22]],
            halfpeak: [
              [9, 16],
              [22, 24],
            ],
            offpeak: [[0, 9]],
          },
          saturday: {
            offpeak: [[0, 24]],
          },
          sunday: {
            offpeak: [[0, 24]],
          },
        },
        非夏月: {
          weekdays: {
            halfpeak: [
              [6, 11],
              [14, 24],
            ],
            offpeak: [
              [0, 6],
              [11, 14],
            ],
          },
          saturday: {
            offpeak: [[0, 24]],
          },
          sunday: {
            offpeak: [[0, 24]],
          },
        },
      },
      prices: {
        offPeakPrices: {
          夏月: "NT$1.96",
          非夏月: "NT$1.89",
        },
        peakPrices: {
          夏月: "NT$6.92",
          非夏月: "NT$4.33",
        },
        halfPeakPrices: {
          夏月: "NT$4.54",
          非夏月: "NT$4.33",
        },
      },
      基本電費: {
        單相: {
          夏月: 75.0,
          非夏月: 75.0,
        },
      },
      每月鐘度數超過2000度之部分: 1.02,
    },
  },
  CO2: 0.494,
  activePricingStandard: "簡易型時間電價三段式",
  contractCapacity: 5,
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
  try {
    await fs.writeFile(filePath, data, "utf-8");
    console.log("Settings written successfully");
  } catch (error) {
    console.error("Error writing settings to file:", error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const settings = await readSettingsFromFile();
      res.status(200).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to read settings", error });
    }
  } else if (req.method === "PATCH") {
    try {
      const updates = req.body;
      const settings = await readSettingsFromFile();

      // Merge the updates into the existing settings
      const updatedSettings = {
        ...settings,
        ...updates,
        machineGroups: updates.machineGroups || settings.machineGroups,
      };

      await writeSettingsToFile(updatedSettings);
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res
        .status(500)
        .json({ message: "Failed to update settings", error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
