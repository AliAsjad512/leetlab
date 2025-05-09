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
      email:loggedinUser.email

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

export default isloggedIn;

// export const authMiddleware = async(req , res, next)=>{

//     try {
//         const token = req.cookies.jwt;

//       if(!token){
//         return res.status(401).json({
//             message: "Unauthorized - No token provided"
//         })
//       }
//     let decoded;
//     try {
//         decoded = jwt.verify(token,process.env.JWT_SECRET);
        
//     } catch (error) {
//         return res.status(401).json({
//             message : "Unauthorized - Invalid token"
//         })
        
//     }

//   const user = await db.user.findUnique({
//     where:{
//         id:decoded.id
//     },
//     select:{
//         id:true,
//         image:true,
//         name:true,
//         email:true,
//         role:true
//     }
//   })

//   if(!user){
//     return res.status(404).json({
//         message:"User not found"
//     })
//   }

//   req.user = user;
//   next()
        
//     } catch (error) {
//         console.error("Error authenticating user",error);
//         res.status(500).json({message: " Error authenticating user"})
//     }




// }

