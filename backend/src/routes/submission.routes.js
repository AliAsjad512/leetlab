import express from "express"
import { isloggedIn } from "../middlewares/auth.middlewares.js";
import { getAllSubmission,getSubmissionsForProblem,getAllTheSubmissionsForProblem } from "../controllers/submission.controller.js";
const submissionRoutes = express.Router()

submissionRoutes.get("/get-all-submission",isloggedIn,getAllSubmission)
submissionRoutes.get("/get-submission/:problemId",isloggedIn,getSubmissionsForProblem)

submissionRoutes.get("/get-submissions-count/:problemId",isloggedIn,getAllTheSubmissionsForProblem)

export default submissionRoutes;