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

    console.log("resultresultresult", result);

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

exports.addParty = async (req, res) => {
  try {
    console.log("rrr", req.body);

    const { title, world_name, region, exp_condition, channel, password, min_level, max_level, creator_id } = req.body;
    const { user_id } = req.user;

    const result = await partyModel.addParty({ title, world_name, region, exp_condition, channel, password, min_level, max_level, creator_id });

    if (result.affectedRows > 0) {
      await partyModel.updateStatus({ player_id: creator_id, party_id: result.insertId, status: 1 });

      res.status(200).json({ success: true, message: "파티 추가 성공" });
    } else {
      res.status(500).json({ success: false, message: "파티 추가 실패" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

exports.getMyParty = async (req, res) => {
  try {
    const { player_id } = req.params;
    const result = await partyModel.getMyParty({ player_id });

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};
