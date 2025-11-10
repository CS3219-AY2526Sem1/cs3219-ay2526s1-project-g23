import moment from "moment";

const collaborationController = {
  exitSession: async (req, res) => {
    try {
      const { userId, sessionId, solution } = req.body;

      const baseReqHeaders = {
        Authorization: req.header("Authorization"),
        "Content-Type": "application/json",
      };

      const getSessionResponse = await fetch(
        `http://localhost:3003/api/matching/session/${sessionId}`,
        {
          method: "GET",
          headers: baseReqHeaders,
        }
      );

      if (!getSessionResponse.ok) {
        throw new Error(
          `Matching service returned ${getSessionResponse.status}`
        );
      }
      const session = await getSessionResponse.json();
      const partner = session.participants.find(
        (user) => user.userId != userId
      );
      const difficulty = session.sessionCriteria.difficulty;

      const updateOwnSessionResponse = await fetch(
        `http://localhost:3003/api/matching/sessions/${sessionId}/participant-status`,
        {
          method: "PATCH",
          headers: baseReqHeaders,
          body: JSON.stringify({ status: "completed" }),
        }
      );

      if (!updateOwnSessionResponse.ok) {
        throw new Error(
          `Matching service returned ${updateOwnSessionResponse.status}`
        );
      }

      if (partner.status == "completed") {
        const updateSessionResponse = await fetch(
          `http://localhost:3003/api/matching/sessions/${sessionId}/session-status`,
          {
            method: "PATCH",
            headers: baseReqHeaders,
            body: JSON.stringify({ status: "completed" }),
          }
        );

        if (!updateSessionResponse.ok) {
          throw new Error(
            `Matching service returned ${updateSessionResponse.status}`
          );
        }
      }

      const saveAttemptResponse = await fetch(
        "http://localhost:3002/attempts",
        {
          method: "POST",
          headers: baseReqHeaders,
          body: JSON.stringify({
            userId,
            partnerId: partner.userId,
            questionId: session.questionId,
            timeTakenSeconds: moment().diff(
              moment(session.createdAt),
              "seconds"
            ),
            difficulty:
              difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
            solution,
          }),
        }
      );

      if (!saveAttemptResponse.ok) {
        throw new Error(
          `Question service returned ${saveAttemptResponse.status}`
        );
      }

      res.status(200).json({ message: "Exit session successfully" });
    } catch (err) {
      console.error("Exit session error:", err);
      res.status(500).json({
        error: "Failed to exit session",
        message: "Unable to exit session",
      });
    }
  },
};

export default collaborationController;
