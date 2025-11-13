/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tariffs", (table) => {
        table.increments("id").primary();
        table.date("date");
        table.string("warehouseName");
        table.float("boxDeliveryBase");
        table.float("boxDeliveryCoefExpr");
        table.float("boxDeliveryLiter");
        table.float("boxStorageBase");
        table.float("boxStorageCoefExpr");
        table.float("boxStorageLiter");
        table.string("geoName").defaultTo("");
        table.unique(["date", "warehouseName"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tariffs");
}
