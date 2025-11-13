/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    // Удаляем старые записи
    await knex("spreadsheets").del();

    // Добавляем новые
    await knex("spreadsheets").insert([
        {
            spreadsheet_id: "16iDcaBN7RkkxwMQdjuvweILKcpIaNUj6A97xnsGNpRs",
            sheet_name: "stocks_coefs",
            range: "A1",
            active: true,
        },
        {
            spreadsheet_id: "1uxsB9piz9XmQxccLHpPZhnPEaGpXsIIPduz07Kim2GA",
            sheet_name: "stocks_coefs",
            range: "A1",
            active: true,
        },
    ]);
}
