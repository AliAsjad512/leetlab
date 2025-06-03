import express from "express"
import { isloggedIn } from "../middlewares/auth.middlewares.js";

import { addProblemToPlaylist, createPlaylist, deletePlaylist, getAllListDetails, getPlayListDetails, removeProblemFromPlaylist } from "../controllers/playlist.controller.js";

const playlistRoutes = express.Router();

playlistRoutes.get("/",isloggedIn,getAllListDetails);

playlistRoutes.get("/:playlistId",isloggedIn,getPlayListDetails);
playlistRoutes.post("/create-playlist",isloggedIn,createPlaylist)

playlistRoutes.post("/:playlistId/add-problem",isloggedIn,addProblemToPlaylist)
playlistRoutes.delete("/:playlistId",isloggedIn,deletePlaylist);
playlistRoutes.delete("/:playlistId/remove-problem",isloggedIn,removeProblemFromPlaylist)
export default playlistRoutes;