import express from "express";
import collaborationController from "../controllers/collaborationController.js";

const router = express.Router();

router.post("/exit", collaborationController.exitSession);

export default router;
