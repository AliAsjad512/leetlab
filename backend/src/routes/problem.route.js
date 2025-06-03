import express from "express"
import {isloggedIn,checkAdmin} from "../middlewares/auth.middlewares.js";
import {createProblem,getAllProblems,getProblemById,updateProblem,deleteProblem,getAllProblemsSolvedByUser }from "../controllers/problem.controller.js";



const problemRoutes = express.Router();

problemRoutes.post("/create-problem",isloggedIn,checkAdmin,createProblem)

problemRoutes.get("/get-all-problems",isloggedIn,getAllProblems)

 problemRoutes.get("/get-problem/:id",isloggedIn,getProblemById);

 problemRoutes.put("/update-problem/:id",isloggedIn,checkAdmin, updateProblem)

  problemRoutes.delete("/delete-problem/:id",isloggedIn,checkAdmin, deleteProblem)

problemRoutes.get("/get-solved-problems",isloggedIn,getAllProblemsSolvedByUser)

export default problemRoutes;



