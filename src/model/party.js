const db = require("../db");
const axios = require("axios");

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
    const [rows] = await db.query("select pp.*, p.name, p.character_job, p.ocid from party_player pp left join players p on p.id = pp.player_id where party_id = ?", [party_id]);
    // and status > 0
    const redis = app.get("redis");
    redis.setExAsync(`party_player:${party_id}`, 3600, JSON.stringify(rows));

    const result = await Promise.all(
      rows.map(async (v) => {
        console.log("zxc", v);
        const playerInfo = await redis.getAsync(`player:${v.ocid}`);

        if (!playerInfo) {
          const nexonResult = await axios.get(`https://open.api.nexon.com/maplestorym/v1/character/basic?ocid=${v.ocid}`, {
            headers: {
              ["x-nxopen-api-key"]: process.env.NEXON_API_KEY,
            },
          });

          if (!nexonResult.data) {
            throw new Error("사용자 정보가 없습니다.");
          }

          const imageUrl = `assets/img/${nexonResult.data.character_job_name}.jpg`;

          redis.setExAsync(`player:${v.ocid}`, 3600, JSON.stringify({ ...nexonResult.data, created_at: new Date(), image_url: imageUrl }));

          return { ...v, ...nexonResult.data, image_url: imageUrl };
        }

        return { ...v, ...JSON.parse(playerInfo) };
      })
    );

    return result;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateStatus = async ({ player_id, party_id, status, redis }) => {
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM parties WHERE id = ?", [party_id]);

    console.log("countcount", count);

    if (count === 0) {
      throw new Error("존재하지 않는 파티입니다.");
    }

    const [existing] = await db.query("SELECT * FROM party_player WHERE player_id = ?", [player_id]);

    let query;
    let params;
    switch (status) {
      case 1: // 가입
        if (existing.length > 0) {
          const connection = await db.getConnection();
          try {
            await connection.beginTransaction();

            const prev_party_id = existing[0].party_id;

            await connection.query("UPDATE party_player SET party_id = ?, status = ? WHERE player_id = ?", [prev_party_id, -1, player_id]);
            const [res2] = await connection.query("INSERT INTO party_player (party_id, player_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?", [party_id, player_id, status, status]);

            await connection.commit();
            return res2;
          } catch (err) {
            await connection.rollback();
            throw new Error(err.message);
          } finally {
            connection.release();
          }
        } else {
          query = "INSERT INTO party_player (party_id, player_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?";
          params = [party_id, player_id, status, status];
        }
        break;
      case 0: // 외출
      case -1: // 탈퇴
        query = "UPDATE party_player SET status = ?, updated_at = ? WHERE party_id = ? AND player_id = ?";
        params = [status, new Date(), party_id, player_id];
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

exports.addParty = async ({ title, world_name, region, exp_condition, channel, password, min_level, max_level, creator_id }) => {
  try {
    const [rows] = await db.query("insert into parties (title, world, region, exp_condition, channel, password, min_level, max_level, creator_id) values (?,?,?,?,?,?,?,?,?)", [
      title,
      world_name,
      region,
      exp_condition,
      channel,
      password,
      min_level,
      max_level,
      creator_id,
    ]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getMyParty = async ({ player_id }) => {
  try {
    const [rows] = await db.query("SELECT p.*,count(pp.party_id) as player_count FROM parties p join party_player pp on p.id = pp.party_id where pp.player_id = ? group by p.id;", [player_id]);

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};
