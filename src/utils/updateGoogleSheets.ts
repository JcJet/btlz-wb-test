import { google } from "googleapis";
import knex from "#postgres/knex.js";
import path from "node:path";
import process from "node:process";

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), "google-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export const updateGoogleSheets = async () => {
    try {
        // Получаем все активные spreadsheets из БД
        const spreadsheets = await knex("spreadsheets").where({ active: true }).select("spreadsheet_id", "sheet_name", "range");

        if (spreadsheets.length === 0) {
            console.warn("No active spreadsheets found in DB — skipping update.");
            return;
        }

        // Достаём данные тарифов
        const tariffs = await knex("tariffs")
            .orderBy("boxDeliveryCoefExpr", "asc")
            .select("date", "warehouseName", "boxDeliveryCoefExpr", "boxStorageCoefExpr", "geoName");

        if (tariffs.length === 0) {
            console.warn("No tariffs found — skipping Google Sheets update.");
            return;
        }

        const values = [
            ["Date", "Warehouse", "DeliveryCoef", "StorageCoef", "Geo"], // заголовок
            ...tariffs.map((t) => [t.date, t.warehouseName, t.boxDeliveryCoefExpr, t.boxStorageCoefExpr, t.geoName]),
        ];

        console.log(`Prepared ${values.length - 1} rows to update.`);

        // Обновляем каждую активную таблицу
        for (const sheet of spreadsheets) {
            try {
                console.log(`Updating spreadsheet: ${sheet.spreadsheet_id} (${sheet.sheet_name})`);

                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheet.spreadsheet_id,
                    range: `${sheet.sheet_name}!${sheet.range}`,
                    valueInputOption: "RAW",
                    requestBody: { values },
                });

                console.log(`Updated ${sheet.spreadsheet_id} successfully.`);
            } catch (innerError) {
                console.error(`Failed to update ${sheet.spreadsheet_id}:`, innerError instanceof Error ? innerError.message : innerError);
            }
        }
    } catch (error) {
        console.error("Error updating Google Sheets:", error instanceof Error ? error.message : error);
    }
};
