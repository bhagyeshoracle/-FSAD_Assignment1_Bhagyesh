const { getDb } = require("./db");

const db = getDb();

const reset = db.transaction(() => {
  db.prepare("DELETE FROM borrow_requests").run();
  db.prepare(
    `UPDATE equipment
     SET available_quantity = total_quantity,
         updated_at = CURRENT_TIMESTAMP`
  ).run();
});

reset();
console.log("Demo data reset complete.");
