import { TariffsResponse, WarehouseTariff } from "#types/wb.js";
import axios from "axios";
import dotenv from "dotenv";
import knex from "knex";

dotenv.config();

const API_URL = process.env.WB_API_URL || "https://common-api.wildberries.ru/api/v1/tariffs/box";

export const fetchTariffs = async (date: string): Promise<void> => {
    try {
        const token = process.env.WB_API_TOKEN;

        if (!token) throw new Error("WB_API_TOKEN is not set in .env");

        const { data } = await axios.get<TariffsResponse>(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
            params: { date },
        });

        const warehouses = data.response.data.warehouseList;

        const formattedTariffs = warehouses.map((warehouse: WarehouseTariff) => ({
            date,
            warehouseName: warehouse.warehouseName,
            boxDeliveryBase: parseFloat(warehouse.boxDeliveryBase.replace(",", ".")),
            boxDeliveryCoefExpr: parseFloat(warehouse.boxDeliveryCoefExpr.replace(",", ".")),
            boxDeliveryLiter: parseFloat(warehouse.boxDeliveryLiter.replace(",", ".")),
            boxStorageBase: parseFloat(warehouse.boxStorageBase.replace(",", ".")),
            boxStorageCoefExpr: parseFloat(warehouse.boxStorageCoefExpr.replace(",", ".")),
            boxStorageLiter: parseFloat(warehouse.boxStorageLiter.replace(",", ".")),
            geoName: warehouse.geoName || "",
        }));

        const database = knex({
            client: "pg",
            connection: {
                host: process.env.POSTGRES_HOST || "postgres",
                user: process.env.POSTGRES_USER || "postgres",
                port: Number(process.env.POSTGRES_PORT) || 5432,
                password: process.env.POSTGRES_PASSWORD || "postgres",
                database: process.env.POSTGRES_DB || "postgres",
            },
        });
        await database("tariffs").insert(formattedTariffs).onConflict(["date", "warehouseName"]).merge();

        console.log(`[${date}] Tariffs updated successfully (${formattedTariffs.length} records)`);
    } catch (error) {
        console.error("Error fetching tariffs:", error instanceof Error ? error.message : error);
    }
};
