const partyModel = require("../model/party");

exports.createParty = async (req, res) => {
  try {
    const { title, server, region, player_id, description, exp_condition, level_condition, channel, password } = req.body;

    const result = await partyModel.create({ title, server, region, player_id, description, exp_condition, level_condition, channel, password });

    if (result.affectedRows > 0) {
      partyModel.updateStatus({ user_id: player_id, party_id: result.insertId, status: 1 });

      res.status(201).json({ success: true, message: "파티방 생성 성공" });
    } else {
      res.status(500).json({ success: false, message: "파티방 생성 실패" });
    }
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ success: false, message: err });
  }
};

exports.editParty = async (req, res) => {
  try {
    const result = await partyModel.edit(req.body);

    if (result.affectedRows > 0) {
      res.status(200).json({ success: true, message: "파티방 수정 성공" });
    } else {
      res.status(500).json({ success: false, message: "파티방 수정 실패" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

exports.getParty = async (req, res) => {
  try {
    const result = await partyModel.get();

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

exports.getPartyPlayer = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await partyModel.getPartyPlayer({ app: req.app, party_id: id });

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};
