const db = require("../db");

exports.create = async ({ title, server, region, player_id, description, exp_condition, level_condition, channel, password }) => {
  try {
    if (!title || !server || !region || !player_id) {
      throw new Error("입력값 오류");
      // return "입력값 오류";
    }

    // 중복 체크
    const [existing] = await db.query("SELECT COUNT(*) AS count FROM parties WHERE title = ? ", [title]);

    console.log("existingexisting", existing);

    if (existing?.[0]?.count > 0) {
      throw new Error("같은 이름의 파티방이 존재합니다.");
    }

    const [rows] = await db.query("insert into parties (title, server, region, creator_id, description, exp_condition, level_condition, channel, password) values (?,?,?,?, ?,?,?,?,?)", [
      title,
      server,
      region,
      player_id,
      description,
      exp_condition,
      level_condition,
      channel,
      password,
    ]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.edit = async ({ id, ...rest }) => {
  try {
    if (Object.keys(rest).length === 0) {
      throw new Error("값 없음");
    }

    const keys = Object.keys(rest);
    const values = Object.values(rest);

    const [rows] = await db.query(`update parties set ${keys.join((v) => `${v} = ?`)} where id = ?`, [...values, id]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.get = async () => {
  try {
    const [rows] = await db.query("select p.*, count(pp.party_id) as player_count from parties p left join party_player pp on p.id = pp.party_id group by p.id");

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPartyPlayer = async ({ app, party_id }) => {
  try {
    const [rows] = await db.query("select * from party_player where party_id = ?", [party_id]);
    // and status > 0
    const redis = app.get("redis");
    // console.log("redis", redis);
    redis.setExAsync(`party_player:${party_id}`, 3600, JSON.stringify(rows));

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateStatus = async ({ user_id, party_id, status }) => {
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM parties WHERE id = ?", [party_id]);

    if (count === 0) {
      throw new Error("존재하지 않는 파티입니다.");
    }

    let query;
    let params;
    switch (status) {
      case 1: // 가입
        query = "INSERT INTO party_player (party_id, player_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?";
        params = [party_id, user_id, status, status];
        break;
      case 0: // 외출
      case -1: // 탈퇴
        query = "UPDATE party_player SET status = ?, updated_at = ? WHERE party_id = ? AND player_id = ?";
        params = [status, new Date(), party_id, user_id];
        break;
      default:
        throw new Error("Invalid status");
    }

    const [rows] = await db.query(query, params);
    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};