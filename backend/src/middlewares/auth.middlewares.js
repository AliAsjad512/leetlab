import jwt from "jsonwebtoken"
import {db} from "../libs/db.js"
import { ApiError } from "../utils/ApiError.js";


const isloggedIn = async(req, res,next) =>{
  const accessToken = req.cookies?.AccessToken;

  if(accessToken){
    try {
      const decodedData =jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
      );
      req.user = decodedData;
      
    } catch (err) {
      console.error("Access Token not found");
      throw new ApiError(404, "Token is invalid", err);
    }
    return next()
  }

  const refreshToken = req.cookies?.RefreshToken;
  if(!refreshToken){
    throw new ApiError(404,"User is logged Out.Please login again")
  }

  let decodedRefresh;
  try {
    decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
  } catch(err){
    throw new ApiError(400,"Refresh Token is invalid")
  }

  const loggedinUser = await db.User.findUnique({ where : {id:decodedRefresh.id}})
  if(!loggedinUser){
    throw new ApiError(404,"User not found");
  }

  if (!(loggedinUser.refreshToken == refreshToken)) {
    throw new ApiError(400, "Refresh token is fake");
  }

  const newAccessToken = jwt.sign(
    {
      id:loggedinUser.id,
      password:loggedinUser.password,
      email:loggedinUser.email,
      role: loggedinUser.role 

  },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: "15m"},

)
const accessTokenCookieOptions = {
  httpOnly:true,
  secure : process.env.NODE_ENV === "production",
  sameSite : "lax",
  maxAge : 1 * 60 * 1000,
}

req.user = jwt.decode(newAccessToken);
next()


}

const checkAdmin =async(req,res,next) =>{
  console.log("full user",req.user)
  try {
    const userId = req.user.id;
    
    const user = await db.user.findUnique({
      where: {
        id:userId
      },
      select : {
        role:true,
      }
    })

  console.log("user information here ",user)

    if(!user || user.role !== "ADMIN"){
      throw new ApiError(403, "Access denied - Admins only");
      // return res.status(403).json({
      //   message: "Access denied - Admins only "
      // })
    }
     req.user.role = user.role;
     console.log(req.user.role)

  next()
    
  } catch (error) {
    console.error("Error checking admin role");
      throw new ApiError(404, "Error checking admin role", error);
    // console.error("Error checking admin role:",error);
    // res.status(500).json({message: "Error checking admin role"})
    
  }
}





export  {isloggedIn,checkAdmin};



