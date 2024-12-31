const db = require("../db");

exports.create = () => {};

exports.getUsers = async () => {
  const [rows] = await db.query("select * from users");
};

exports.getUser = async (id) => {
  const [rows] = await db.query("select id,user_id,created_at,nickname from users where id = ?", [id]);

  return rows[0];
};
