const db = require("../db");

exports.create = () => {};

exports.getUsers = async () => {
  const [rows] = await db.query("select * from users");
};
