const partyModel = require("../model/party");

exports.createParty = async (req, res) => {
  try {
    const { title, world_name, region, creator_id, description, exp_condition, min_level, max_level, channel, password } = req.body;

    console.log("req.body", req.body);

    const result = await partyModel.create({ title, world_name, region, creator_id, description, exp_condition, min_level, max_level, channel, password });

    console.log("rr123", result);

    if (result.affectedRows > 0) {
      partyModel.updateStatus({ player_id: creator_id, party_id: result.insertId, status: 1 });

      const redis = req.app.get("redis");

      const parties = await partyModel.get();

      redis.setExAsync(`parties:${world_name}`, 3600, JSON.stringify(parties));

      redis.pubClient.publish(
        "server",
        JSON.stringify({
          room: world_name,
          event: "updatePartyList",
          data: parties,
        })
      );
      res.status(201).json({ success: true, message: "파티방 생성 성공" });
    } else {
      res.status(500).json({ success: false, message: "파티방 생성 실패" });
    }
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ success: false, message: err.message });
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

exports.getParties = async (req, res) => {
  try {
    const { world } = req.params;
    const app = req.app;

    const result = await partyModel.get({ world, app });

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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
    console.log("getMyParty rrrr", result);

    res.status(200).json({ success: true, list: result });
  } catch (err) {
    console.log("getMyParty err", err);
    res.status(500).json({ success: false, message: err });
  }
};
