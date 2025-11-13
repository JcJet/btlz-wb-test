import cron from "node-cron";
import { fetchTariffs } from "./fetchTariffs.js";
import { updateGoogleSheets } from "./updateGoogleSheets.js";

export const scheduler = () => {
    const cronString = process.env.CRON_SCHEDULE || "0 * * * *"; // По умолчанию - каждый час в начале часа
    cron.schedule(cronString, async () => {
        const today = new Date().toISOString().split("T")[0];
        await fetchTariffs(today);
        await updateGoogleSheets();
    });
};
