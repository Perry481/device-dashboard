import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "machineOrder.json");

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      const machineOrder = JSON.parse(data);
      res.status(200).json(machineOrder);
    } catch (error) {
      console.error("Error reading machine order:", error);
      res.status(500).json({
        message: "Failed to read machine order",
        error: error.message,
      });
    }
  } else if (req.method === "POST") {
    try {
      const updatedOrder = req.body;
      await fs.writeFile(filePath, JSON.stringify(updatedOrder, null, 2));
      res.status(200).json({ message: "Machine order updated successfully" });
    } catch (error) {
      console.error("Error updating machine order:", error);
      res.status(500).json({
        message: "Failed to update machine order",
        error: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
