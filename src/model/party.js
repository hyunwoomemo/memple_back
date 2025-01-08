const db = require("../db");
const axios = require("axios");

exports.create = async ({ title, world_name, region, creator_id, description, exp_condition, level_condition, channel, password, min_level, max_level }) => {
  try {
    if (!title || !world_name || !region || !creator_id) {
      throw new Error("입력값 오류");
      // return "입력값 오류";
    }

    // 이미 가입되어 있는 파티 있는지 확인

    const [joinedParty] = await db.query("SELECT * FROM party_player WHERE player_id = ? and status > -1", [creator_id]);


    if (joinedParty.length > 0) {
      throw new Error("이미 가입되어 있는 파티가 있습니다.");
    }

    // 중복 체크
    const [existing] = await db.query("SELECT COUNT(*) AS count FROM parties WHERE title = ? ", [title]);

    console.log("existingexisting", existing);

    if (existing?.[0]?.count > 0) {
      throw new Error("같은 이름의 파티방이 존재합니다.");
    }

    const [rows] = await db.query("insert into parties (title, world, region, creator_id, description, exp_condition, min_level,max_level, channel, password) values (?,?,?,?, ?,?,?,?,?,?)", [
      title,
      world_name,
      region,
      creator_id,
      description,
      exp_condition,
      min_level,
      max_level,
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
    const [rows] = await db.query("SELECT p.*, COUNT(CASE WHEN pp.status > -1 THEN pp.party_id END) AS player_count FROM parties p LEFT JOIN party_player pp ON p.id = pp.party_id GROUP BY p.id;");

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPartyPlayer = async ({ app, party_id }) => {
  try {
    const [rows] = await db.query("select pp.*, p.name, p.character_job, p.ocid from party_player pp left join players p on p.id = pp.player_id where party_id = ? and pp.status > -1", [party_id]);
    // and status > 0
    const redis = app.get("redis");
    redis.setExAsync(`party_player:${party_id}`, 3600, JSON.stringify(rows));

    const result = await Promise.all(
      rows.map(async (v) => {
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

    const [existing] = await db.query("SELECT * FROM party_player WHERE player_id = ? and status > -1", [player_id]);

    console.log("existingexisting", existing);

    let query;
    let params;
    switch (status) {
      case 1: // 가입
        if (existing.length > 0 && existing[0].status === 1) {
          // const connection = await db.getConnection();
          // try {
          //   await connection.beginTransaction();

          //   const prev_party_id = existing[0].party_id;

          //   await connection.query("UPDATE party_player SET party_id = ?, status = ? WHERE player_id = ?", [prev_party_id, -1, player_id]);
          //   const [res2] = await connection.query("INSERT INTO party_player (party_id, player_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?", [party_id, player_id, status, status]);

          //   await connection.commit();
          //   return res2;
          // } catch (err) {
          //   await connection.rollback();
          //   throw new Error(err.message);
          // } finally {
          //   connection.release();
          // }

          throw new Error("이미 가입되어있는 파티가 있습니다.");
        } else {
          query = "INSERT INTO party_player (party_id, player_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, party_id = ?";
          params = [party_id, player_id, status, status, party_id];
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
    console.log("err", err);
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
    const [rows] = await db.query(
      `SELECT 
    p.*, 
    (SELECT COUNT(*) 
     FROM party_player pp_sub 
     WHERE pp_sub.party_id = p.id AND pp_sub.status > -1) AS player_count 
FROM 
    parties p 
JOIN 
    party_player pp 
ON 
    p.id = pp.party_id 
WHERE 
    pp.player_id = ?
AND 
    pp.status > -1 
GROUP BY 
    p.id;`,
      [player_id]
    );

    return rows;
  } catch (err) {
    throw new Error(err.message);
  }
};
