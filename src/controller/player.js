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
