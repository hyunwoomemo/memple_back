const { default: axios } = require("axios");
const db = require("../db");
const playerModel = require("../model/player");

exports.createPlayer = async (req, res) => {
  try {
    const { name, server } = req.body;

    console.log("nnnn", name, server);

    const result = await playerModel.create({ name, server });

    if (result.affectedRows > 0) {
      res.status(201).json({ success: true, message: "플레이어 생성 성공" });
    } else {
      res.status(500).json({ success: false, message: "플레이어 생성 실패" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.testLogin = async (req, res) => {
  console.log("req.body", req.body);

  try {
    const { name, server } = req.body;

    const result = await playerModel.testLogin({ name, server });

    if (result.length > 0) {
      res.status(200).json({ success: true, message: "로그인 성공" });
    } else {
      res.status(500).json({ success: false, message: "로그인 실패" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  console.log("register", req.body, req.user);

  try {
    const redis = req.app.get("redis");

    const { ocid } = req.body;

    const data = await playerModel.getPlayer({ ocid, user_id: req.user.user_id });

    if (data.length > 0) {
      if (data[0].status > -1) {
        return res.status(400).json({ success: false, message: "이미 등록된 플레이어입니다." });
      } else {
        const [result] = await db.query("update players set status = ? where user_id = ? and ocid = ?", [1, req.user.user_id, ocid]);

        console.log("resultresultresult", result);

        if (result.affectedRows > 0) {
          redis.setExAsync(`my_players:${req.user.user_id}`, 3600, JSON.stringify([]));
          res.status(200).json({ success: true, message: "등록되었습니다.", insertId: result.insertId });
        } else {
          res.status(500).json({ success: false, message: "등록에 실패했습니다." });
        }
      }
    } else {
      const result = await playerModel.register({ ...req.body, user_id: req.user.user_id, app: req.app });

      console.log("resultresult", result);

      if (result.affectedRows > 0) {
        redis.setExAsync(`my_players:${req.user.user_id}`, 3600, JSON.stringify([]));
        res.status(200).json({ success: true, message: "등록되었습니다.", insertId: result.insertId });
      } else {
        res.status(500).json({ success: false, message: "등록에 실패했습니다." });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPlayers = async (req, res) => {
  try {
    const { user_id } = req.user;
    const result = await playerModel.getPlayers({ app: req.app, user_id });

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.select = async (req, res) => {
  try {
    const { id, status } = req.body;
    const { user_id } = req.user;

    const result = await playerModel.select({ user_id, id, status });

    if (result.affectedRows > 0) {
      const redis = req.app.get("redis");

      redis.setExAsync(`my_players:${user_id}`, 3600, JSON.stringify([]));

      res.status(200).json({ success: true, message: "요청에 성공했습니다." });
    } else {
      res.status(500).json({ success: false, message: "요청에 실패했습니다." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInfo = async (req, res) => {
  try {
    const { ocid } = req.params;

    console.log("ocid", ocid);

    if (!ocid) {
      throw new Error("ocid가 없습니다.");
    }

    const redis = req.app.get("redis");

    const playerData = await redis.getAsync(`player:${ocid}`);

    if (!playerData) {
      const nexonResult = await axios.get(`https://open.api.nexon.com/maplestorym/v1/character/basic?ocid=${ocid}`, {
        headers: {
          ["x-nxopen-api-key"]: process.env.NEXON_API_KEY,
        },
      });

      console.log("nexonResult", nexonResult.data);

      if (!nexonResult.data) {
        throw new Error("사용자 정보가 없습니다.");
      }

      const imageUrl = `assets/img/${nexonResult.data.character_job_name}.jpg`;

      redis.setExAsync(`player:${ocid}`, 3600, JSON.stringify({ ...nexonResult.data, created_at: new Date(), image_url: imageUrl }));

      // const result = await playerModel.getUser({ user_id });
      res.status(200).json({ success: true, user: { ...nexonResult.data, image_url: imageUrl } });
    } else {
      console.log("cache data!!!");
      res.status(200).json({ success: true, user: JSON.parse(playerData) });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

exports.selectedPlayer = async (req, res) => {
  try {
    const { user_id } = req.user;

    const result = await playerModel.selectedPlayer({ user_id });

    if (!result || Object.keys(result).length === 0) {
      res.status(200).json({ success: true, message: "선택된 플레이어가 없습니다." });
    } else {
      const redis = req.app.get("redis");

      const playerInfo = await redis.getAsync(`player:${result.ocid}`);

      if (!playerInfo) {
        const nexonResult = await axios.get(`https://open.api.nexon.com/maplestorym/v1/character/basic?ocid=${result.ocid}`, {
          headers: {
            ["x-nxopen-api-key"]: process.env.NEXON_API_KEY,
          },
        });

        if (!nexonResult.data) {
          throw new Error("사용자 정보가 없습니다.");
        }

        const imageUrl = `assets/img/${nexonResult.data.character_job_name}.jpg`;

        redis.setExAsync(`player:${result.ocid}`, 3600, JSON.stringify({ ...nexonResult.data, created_at: new Date(), image_url: imageUrl }));

        res.status(200).json({ success: true, data: { ...result, ...nexonResult.data, image_url: imageUrl } });
      } else {
        res.status(200).json({ success: true, data: { ...result, ...JSON.parse(playerInfo) } });
      }
    }

    // res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { player_id } = req.body;
    const redis = req.app.get("redis");

    const result = await playerModel.deletePlayer({ player_id, user_id: req.user.user_id });

    if (result.affectedRows > 0) {
      redis.setExAsync(`my_players:${req.user.user_id}`, 3600, JSON.stringify([]));

      res.status(200).json({ success: true, message: "삭제 되었습니다." });
    }
  } catch (err) {
    res.status(500).json({ sucess: false, message: err.message });
  }
};
