const db = require("../db");

// 플레이어 추가
exports.create = async ({ server, name }) => {
  try {
    if (!name || typeof name !== "string" || !server || typeof server !== "string") {
      throw new Error("입력값 오류");
    }

    // 중복 체크
    const [[existing]] = await db.query("SELECT COUNT(*) AS count FROM players WHERE name = ? AND server = ?", [name, server]);

    if (existing.count > 0) {
      throw new Error("플레이어가 이미 존재합니다.");
    }

    const [rows] = await db.query("insert into players (name, server, created_at, `like`) values (?,?,?,?)", [name, server, new Date(), 0]);

    return rows;
  } catch (err) {
    console.error("Error: ", err.message);

    throw new Error(err.message);
  }
};

exports.testLogin = async ({ name, server }) => {
  try {
    const [rows] = await db.query("select * from players where name = ? and server = ?", [name, server]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getUser = async ({ user_id }) => {
  try {
    const [rows] = await db.query("select * from players where id = ?", [user_id]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};
