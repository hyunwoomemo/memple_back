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

exports.register = async ({ ocid, user_id, name, character_job, level, world }) => {
  console.log("register123", ocid, user_id, name);

  try {
    const [rows] = await db.query("insert into players (ocid, user_id, name, character_job,created_at, level, world) values (?,?,?,?,?,?,?)", [
      ocid,
      user_id,
      name,
      character_job,
      new Date(),
      level,
      world,
    ]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPlayer = async ({ user_id, ocid }) => {
  try {
    const [rows] = await db.query("select * from players where user_id = ? and ocid = ?", [user_id, ocid]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPlayers = async ({ user_id }) => {
  try {
    const [rows] = await db.query("SELECT p.*, CASE WHEN u.player_id = p.id THEN 1 ELSE 0 END AS status FROM memple.players p JOIN memple.users u ON u.id = p.user_id where u.id = ?;", [user_id]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.select = async ({ id, user_id }) => {
  try {
    const [rows] = await db.query("update users set player_id = ? where id = ?", [id, user_id]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.selectedPlayer = async ({ user_id }) => {
  try {
    const [rows] = await db.query("select p.* from players p join users u on p.user_id = u.id where u.player_id = p.id and u.id = ?", [user_id]);

    return rows[0];
  } catch (err) {
    throw new Error(err.message);
  }
};
