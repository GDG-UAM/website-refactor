import db from "./lib/db";
import { initializeDefaults } from "./lib/init";
import app from "./index";

db.connect()
    .then(async () => {
        console.log("[Server] Database connected");
        await initializeDefaults();

        const port = process.env.PORT || 3000;
        app.listen(port);
        console.log(`[Server] Started on port ${port}`);
    })
    .catch((err) => {
        console.error("[Server] Failed to initialize:", err);
        process.exit(1);
    });
