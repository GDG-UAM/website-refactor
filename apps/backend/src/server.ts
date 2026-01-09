import db from "./lib/db";
import { initializeDefaults } from "./lib/init";
// import { app } from "./index";

db.connect()
    .then(async () => {
        console.log("[Server] Database connected");
        await initializeDefaults();
        // try {
        //     const port = process.env.PORT || 3000;
        //     app.listen(port);
        //     console.log(`[Server] Started on port ${port}`);
        // } catch (error) {
        //     console.error("[Server] Failed to start:", error);
        // }
    })
    .catch((err) => {
        console.error("[Server] Failed to initialize:", err);
    });
