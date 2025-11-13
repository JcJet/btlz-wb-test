import knex, { migrate, seed } from "#postgres/knex.js";
import { scheduler } from "#utils/scheduler.js";

await migrate.latest();
await seed.run();

// Запуск cron-задания для регулярного обновления тарифов
scheduler();

console.log("All migrations and seeds have been run");
