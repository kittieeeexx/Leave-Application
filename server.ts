import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// In-memory store for calendar events
const userRequestsStore: Record<string, any[]> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Sync endpoint to receive latest requests from client
  app.post("/api/calendar/sync", (req, res) => {
    const { userId, requests } = req.body;
    if (userId && requests) {
      userRequestsStore[userId] = requests;
    }
    res.json({ success: true });
  });

  // ICS endpoint for calendar subscription
  app.get("/api/calendar/:userId.ics", (req, res) => {
    const userId = req.params.userId;
    const requests = userRequestsStore[userId] || [];

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Leave Management System//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:My Leave Calendar",
      "X-WR-TIMEZONE:Asia/Hong_Kong"
    ];

    requests.forEach((req: any) => {
      // Only include Approved or Pending leaves
      if (req.status === 'Cancelled' || req.status === 'Rejected') return;

      const startDate = req.startDate.replace(/-/g, "");
      // For all-day events, the end date in ICS should be exclusive (the day after)
      // We'll just use the start and end dates directly for simplicity, or add 1 day to end date
      const endDateObj = new Date(req.endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = endDateObj.toISOString().split('T')[0].replace(/-/g, "");

      const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const uid = `${req.id}@leavemanagement`;

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${req.leaveType} (${req.status})`,
        `DESCRIPTION:Leave Request: ${req.leaveType}\\nStatus: ${req.status}\\nRemarks: ${req.remarks || 'None'}`,
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leave-calendar-${userId}.ics"`);
    res.send(icsContent.join("\r\n"));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
