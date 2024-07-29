import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "cardSettings.json");

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      const cardSettings = JSON.parse(data);
      res.status(200).json(cardSettings);
    } catch (error) {
      console.error("Error reading card settings:", error);
      res.status(500).json({
        message: "Failed to read card settings",
        error: error.message,
      });
    }
  } else if (req.method === "POST") {
    try {
      const updatedSettings = req.body;
      await fs.writeFile(filePath, JSON.stringify(updatedSettings, null, 2));
      res.status(200).json({ message: "Card settings updated successfully" });
    } catch (error) {
      console.error("Error updating card settings:", error);
      res.status(500).json({
        message: "Failed to update card settings",
        error: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
