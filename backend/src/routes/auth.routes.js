// import express from "express"


// import {login,logout,register,check, resetPassword, forgotPassword} from "../controllers/auth.controller.js"
// import { authMiddleware } from "../middleware/auth.middleware.js";

// const authRoutes = express.Router();

// authRoutes.post("/register",register)

// authRoutes.post("/login",login)
// authRoutes.post("/logout",authMiddleware ,logout)
// authRoutes.get("/check",authMiddleware ,check)
// authRoutes.post("/forgot",forgotPassword)
// authRoutes.post("/reset/:token",resetPassword)



// export default authRoutes

import { Router } from "express";
import {
  forgotPassValidators,
   resendVerificationEmailValidators,
   resetPassValidators,
   userloginValidators,
  userRegistrationvalidators,
} from "../validators/auth.validator.js";
 import validators from "../middlewares/validation.middlewares.js";
import {
  forgotPass,
   getProfile,
  loginUser,
  logOut,
   resendverificationemail,
  resetCurrentPass,
  resetPass,
  userRegister,
   verifyUser,
} from "../controllers/auth.controller.js";
 import isloggedIn from "../middlewares/auth.middlewares.js";

const authRoutes = Router();

authRoutes.post("/register",userRegistrationvalidators(),validators,userRegister);
authRoutes.get("/verify/:token",verifyUser)
authRoutes.post("/resend",resendVerificationEmailValidators(),
validators,resendverificationemail)
authRoutes.post("/login",userloginValidators(),validators,loginUser)
authRoutes.get("/profile",isloggedIn,getProfile)
authRoutes.get("/logOut", isloggedIn, logOut);
authRoutes.post("/forget",forgotPassValidators(),validators,forgotPass)
authRoutes.post("/resetPass/:token",resetPassValidators(),validators,resetPass)
authRoutes.post("/resetCurrentPass",resetPassValidators(),isloggedIn,validators,resetCurrentPass)

export default authRoutes