/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("spreadsheets", (table) => {
        table.increments("id").primary();
        table.string("spreadsheet_id").notNullable();
        table.string("sheet_name").notNullable().defaultTo("stocks_coefs");
        table.string("range").defaultTo("A1");
        table.boolean("active").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("spreadsheets");
}
