# 🟣 Wildberries Tariffs → PostgreSQL → Google Sheets Sync Service

## 📖 Описание проекта

Сервис автоматически получает тарифы (стоимость хранения и доставки) со склада Wildberries по официальному API, сохраняет их в базу данных PostgreSQL, и синхронизирует данные с произвольным количеством Google Таблиц.

Проект написан на **Node.js (TypeScript)** с использованием:

- **Knex.js** — миграции и работа с PostgreSQL
- **Axios** — взаимодействие с Wildberries API
- **Google Sheets API (googleapis)** — обновление таблиц
- **node-cron** — регулярное обновление данных
- **Docker Compose** — развёртывание всех компонентов одной командой

---

## ⚙️ Архитектура

```

src/
├─ app.ts                     # Точка входа
├─ postgres/
│   ├─ knex.ts                # Инициализация Knex
│   ├─ migrations/            # Миграции для тарифов и таблиц
│   └─ seeds/                 # Начальные данные для таблиц
├─ utils/
│   ├─ fetchTariffs.ts        # Получение тарифов с WB API
│   ├─ knex.ts                #
│   ├─ updateGoogleSheets.ts  # Обновление всех Google Sheets
│   └─ scheduler.ts           # Планировщик cron-задач
├─ config/
│   └─ knex/knexfile.ts      # Настройка подключения к БД
└─ Dockerfile
google-service-account.example.json  # Пример файла ключей Google
docker-compose.yml
example.env
README.md
```

---

## 🚀 Запуск проекта

1. **Склонировать репозиторий:**

    ```bash
    git clone https://github.com/JcJet/btlz-wb-test.git
    cd btlz-wb-test
    ```

2. **Создать и заполнить `.env`:**

    ```env
    # Application
    APP_PORT=5000
    NODE_ENV=production

    # API Wildberries
    WB_API_URL=https://common-api.wildberries.ru/api/v1/tariffs/box
    WB_API_TOKEN=your_token

    # PostgreSQL
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=postgres
    POSTGRES_PORT=5433
    POSTGRES_HOST=postgres

    # Планировщик (cron)
    CRON_SCHEDULE=0 * * * *   # Каждый час
    ```

3. **Создать файл сервисного аккаунта Google:**

    ```
    google-service-account.json
    ```

    Пример структуры:

    ```json
    {
        "type": "service_account",
        "project_id": "steady-webbing-478112-a4",
        "private_key_id": "your_private_key_id",
        "private_key": "-----BEGIN PRIVATE KEY-----\nABCDEF...\n-----END PRIVATE KEY-----\n",
        "client_email": "service-account@steady-webbing-478112-a4.iam.gserviceaccount.com",
        "client_id": "123456789012345678901",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account"
    }
    ```

4. **Добавить идентификаторы google-таблиц:**

    ```
     src/seeds/spreadsheets.js
    ```

    пример:

    ```js
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

    ```

    примечение: у сервисного аккаунта должен быть доступ на редактирвоание указанных таблиц.

5. **Запустить проект:**

    ```bash
    docker compose up --build
    ```

    При запуске:
    - поднимется контейнер с PostgreSQL,
    - выполнены миграции и сиды,
    - каждый час (по умолчанию), данные тарифов будут получены и сохранены в БД,
    - таблицы Google Sheets будут обновлены.

---

## 🗃️ База данных и миграции

Схема включает две таблицы:

### `tariffs`

| Поле                | Тип    | Описание              |
| ------------------- | ------ | --------------------- |
| id                  | serial | Primary key           |
| date                | date   | Дата тарифа           |
| warehouseName       | string | Название склада       |
| boxDeliveryBase     | float  |                       |
| boxDeliveryCoefExpr | float  | Коэффициент доставки  |
| boxDeliveryLiter    | float  |                       |
| boxStorageBase      | float  |                       |
| boxStorageCoefExpr  | float  | Коэффициент хранения  |
| boxStorageLiter     | float  | Коэффициент хранения  |
| geoName             | string | Географический регион |

### `spreadsheets`

| Поле           | Тип       | Описание          |
| -------------- | --------- | ----------------- |
| id             | serial    | Primary key       |
| spreadsheet_id | string    | ID Google таблицы |
| sheet_name     | string    | Имя листа         |
| range          | string    | Диапазон вставки  |
| active         | boolean   | Флаг активности   |
| created_at     | timestamp | Дата добавления   |

---

## 🌱 Сид для `spreadsheets`

При первом запуске автоматически добавляется пример:

```js
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
```

Можно добавить произвольное количество таблиц — сервис обновит все активные при каждом запуске.

---

## 🕒 Планировщик

Сервис использует `node-cron`.
Задача по обновлению тарифов и синхронизации Google Sheets выполняется автоматически по расписанию, заданному в `.env` через переменную `CRON_SCHEDULE`.

Если параметр не задан - используется значение по умолчанию: каддый час

Например:

```env
CRON_SCHEDULE=0 * * * *   # Каждый час
```

---

## ✅ Основной сценарий работы

1. При запуске контейнера выполняются миграции и сиды.
2. Скрипт `fetchTariffs.ts` делает запрос к Wildberries API:

    ```
    GET https://common-api.wildberries.ru/api/v1/tariffs/box?date=YYYY-MM-DD
    ```

    с Bearer токеном из `.env`.

3. Данные сохраняются в таблицу `tariffs`.
4. Скрипт `updateGoogleSheets.ts` выгружает данные во **все активные Google Sheets**.
5. Планировщик (`scheduler.ts`) запускает обновление ежедневно.

---
