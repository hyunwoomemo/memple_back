const { initRedis } = require("./redis");
const partyModel = require("./model/party");
const playerModel = require("./model/player");

module.exports = async (io, app) => {
  const redis = await initRedis(io);
  app.set("redis", redis);

  io.on("connection", (socket) => {
    // 파티 입장

    if (!socket.handshake.query.server) {
      console.log("선택되어있는 플레이어가 없습니다.");
      // throw new Error("선택되어있는 플레이어가 없습니다.");
      return;
    }

    const server = socket.handshake.query.server;

    socket.join(server);

    socket.emit("message", socket.id);

    socket.on("enterParty", async ({ player_id, party_id }) => {
      try {
        console.log("enterParty player_id", player_id, party_id);

        socket.join(party_id);
        redis.pubClient.lRange(`chat:room:${party_id}`, 0, -1, (err, result) => {
          if (err) {
            console.error("Redis lRange Error:", err);
          } else {
            console.log("Messages:", result);
            const messages = result.map((msg) => JSON.parse(msg));
            redis.pubClient.publish(
              "message",
              JSON.stringify({
                room: socket.id,
                event: "messages",
                data: messages,
              })
            );
          }
        });

        let partyPlayer = (await redis.getAsync(`party_player:${party_id}`)) || (await partyModel.getPartyPlayer({ app, party_id }));

        redis.pubClient.publish(
          "message",
          JSON.stringify({
            room: socket.id,
            event: "partyPlayer",
            data: partyPlayer,
          })
        );

        // console.log("messagesmessages", messages);
      } catch (err) {
        console.error("enterParty error", err);
      }
    });

    // 파티 유저 상태 변경
    socket.on("updateStatusParty", async ({ player_id, party_id, status, prevStatus }) => {
      try {
        const result = await partyModel.updateStatus({ player_id, party_id, status, redis });
        console.log("result", result);

        if (result.affectedRows > 0) {
          const updateParty = await partyModel.getById({ id: party_id });

          // const partyPlayer = await partyModel.getPartyPlayer({ app, party_id });

          redis.pubClient.publish(
            "party",
            JSON.stringify({
              room: party_id,
              event: "partyPlayer",
              data: { message: "요청 성공", data: { party_id, player_id, updateParty }, success: true },
            })
          );

          if (status === -1) {
            redis.pubClient.publish(
              "server",
              JSON.stringify({
                room: server,
                event: "leaveParty",
                data: { message: "파티 탈퇴", data: { party_id, player_id, updateParty }, success: true },
              })
            );
          }

          if (status === 1 && prevStatus !== 0) {
            redis.pubClient.publish(
              "all",
              JSON.stringify({
                room: server,
                event: "joinParty",
                data: { message: "파티 가입", data: { party_id, player_id, updateParty }, success: true },
              })
            );
          }
        } else {
          redis.pubClient.publish(
            "message",
            JSON.stringify({
              room: socket.id,
              event: "error",
              data: { message: "요청에 실패했습니다.", success: false },
            })
          );
        }
      } catch (err) {
        console.log("eee", err);
        redis.pubClient.publish(
          "message",
          JSON.stringify({
            room: socket.id,
            event: "error",
            data: { message: err.message, success: false },
          })
        );
      }
    });

    // 메세지 보내기
    socket.on("message", async ({ player_id, party_id, contents, name }) => {
      const key = `chat:room:${party_id}`;
      // const messages = await redis.getAsync(`messages:${party_id}`);

      const now = new Date();

      // const user = await playerModel.getUser({ user_id });

      await redis.pubClient.lPush(key, JSON.stringify({ player_id, contents, party_id, created_at: now, name }));
      // 리스트 길이 제한 (최신 100개만 유지)
      await redis.pubClient.lTrim(key, 0, 99);

      await redis.pubClient.publish(
        "party",
        JSON.stringify({
          room: party_id,
          event: "message",
          data: { player_id, party_id, contents, created_at: now, name },
        })
      );
    });
  });
};
