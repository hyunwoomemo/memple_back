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
    const data = await playerModel.getPlayer({ ocid: req.body.ocid, user_id: req.user.user_id });

    if (data.length > 0) {
      return res.status(400).json({ success: false, message: "이미 등록된 플레이어입니다." });
    }

    const result = await playerModel.register({ ...req.body, user_id: req.user.user_id });

    console.log("resultresult", result);

    if (result.affectedRows > 0) {
      res.status(200).json({ success: true, message: "등록되었습니다.", insertId: result.insertId });
    } else {
      res.status(500).json({ success: false, message: "등록에 실패했습니다." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPlayers = async (req, res) => {
  try {
    const { user_id } = req.user;
    const result = await playerModel.getPlayers({ user_id });

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

      redis.setExAsync(`player:${ocid}`, 3600, JSON.stringify({ ...nexonResult.data, created_at: new Date() }));

      // const result = await playerModel.getUser({ user_id });
      res.status(200).json({ success: true, user: nexonResult.data });
    } else {
      console.log("cache data!!!");
      res.status(200).json({ success: true, user: JSON.parse(playerData) });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

exports.setInfo = async (req, res) => {
  try {
    console.log("rrr", req.body);

    if (Object.keys(req.body).length === 0) return res.status(400).json({ success: false, message: "필수값 누락" });

    const redis = req.app.get("redis");
    redis.setExAsync(`player:${req.body.ocid}`, 3600, JSON.stringify(req.body));
    res.status(200).json({ success: true, message: "저장되었습니다." });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

exports.selectedPlayer = async (req, res) => {
  try {
    const { user_id } = req.user;

    const result = await playerModel.selectedPlayer({ user_id });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};
