import jwt from "jsonwebtoken"
import {db} from "../libs/db.js"
import { ApiError } from "../utils/ApiError.js";


// const isloggedIn = async(req, res,next) =>{
//   const accessToken = req.cookies?.AccessToken;

//   if(accessToken){
//     try {
//       const decodedData =jwt.verify(
//         accessToken,
//         process.env.ACCESS_TOKEN_SECRET,
//       );
//       req.user = decodedData;
      
//     } catch (err) {
//       console.error("Access Token not found");
//       throw new ApiError(404, "Token is invalid", err);
//     }
//     return next()
//   }

//   const refreshToken = req.cookies?.RefreshToken;
//   if(!refreshToken){
//     throw new ApiError(404,"User is logged Out.Please login again")
//   }

//   let decodedRefresh;
//   try {
//     decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
//   } catch(err){
//     throw new ApiError(400,"Refresh Token is invalid")
//   }

//   const loggedinUser = await db.User.findUnique({ where : {id:decodedRefresh.id}})
//   if(!loggedinUser){
//     throw new ApiError(404,"User not found");
//   }

//   if (!(loggedinUser.refreshToken == refreshToken)) {
//     throw new ApiError(400, "Refresh token is fake");
//   }

//   const newAccessToken = jwt.sign(
//     {
//       id:loggedinUser.id,
//       password:loggedinUser.password,
//       email:loggedinUser.email,
//       role: loggedinUser.role 

//   },
//   process.env.ACCESS_TOKEN_SECRET,
//   { expiresIn: "15m"},

// )
// const accessTokenCookieOptions = {
//   httpOnly:true,
//   secure : process.env.NODE_ENV === "production",
//   sameSite : "lax",
//   maxAge : 1 * 60 * 1000,
// }

// req.user = jwt.decode(newAccessToken);
// next()


// }

// const isloggedIn = async (req, res, next) => {
//   const accessToken = req.cookies?.AccessToken;

//   if (accessToken) {
//     try {
//       const decodedData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
//       req.user = decodedData;
//       return next();
//     } catch (err) {
//       console.error("Access Token invalid or expired:", err);
//       // Continue to check refresh token
//     }
//   }

//   const refreshToken = req.cookies?.RefreshToken;
//   if (!refreshToken) {
//     throw new ApiError(401, "User is logged out. Please login again.");
//   }

//   let decodedRefresh;
//   try {
//     decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//   } catch (err) {
//     throw new ApiError(401, "Refresh Token is invalid.");
//   }

//   const loggedinUser = await db.User.findUnique({ where: { id: decodedRefresh.id } });
//   if (!loggedinUser) {
//     throw new ApiError(404, "User not found");
//   }

//   if (loggedinUser.refreshToken !== refreshToken) {
//     throw new ApiError(401, "Refresh token does not match");
//   }

//   const newAccessToken = jwt.sign(
//     {
//       id: loggedinUser.id,
//       email: loggedinUser.email,
//       role: loggedinUser.role,
//     },
//     process.env.ACCESS_TOKEN_SECRET,
//     { expiresIn: "15m" }
//   );

//   const accessTokenCookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     maxAge: 15 * 60 * 1000, // 15 minutes, same as token expiry
//   };

//   // Send new AccessToken cookie to client
//   res.cookie("AccessToken", newAccessToken, accessTokenCookieOptions);

//   // Attach decoded user info to req.user
//   req.user = jwt.decode(newAccessToken);

//   return next();
// };

const isloggedIn = async (req, res, next) => {
  const accessToken = req.cookies?.AccessToken;
  const refreshToken = req.cookies?.RefreshToken;

  if (!accessToken && !refreshToken) {
    throw new ApiError(401, "User not authenticated. Please login.");
  }

  if (accessToken) {
    try {
      const decodedData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      req.user = {
        id: decodedData.id,
        email: decodedData.email,
        role: decodedData.role,
      };
      return next();
    } catch (err) {
      console.error("Access Token invalid or expired:", err);
      // Continue to check refresh token
    }
  }

  if (!refreshToken) {
    throw new ApiError(401, "User is logged out. Please login again.");
  }

  let decodedRefresh;
  try {
    decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Refresh Token is invalid.");
  }

  const loggedinUser = await db.User.findUnique({ where: { id: decodedRefresh.id } });
  if (!loggedinUser) {
    throw new ApiError(404, "User not found");
  }

  if (loggedinUser.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh token does not match");
  }

  // Issue a new access token
  const newAccessToken = jwt.sign(
    {
      id: loggedinUser.id,
      email: loggedinUser.email,
      role: loggedinUser.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/", // 15 minutes
  };

  // Send new AccessToken cookie to client
  res.cookie("AccessToken", newAccessToken, accessTokenCookieOptions);

  // Attach user info to req.user
  req.user = {
    id: loggedinUser.id,
    email: loggedinUser.email,
    role: loggedinUser.role,
  };

  return next();
};




const checkAdmin =async(req,res,next) =>{
  console.log("full user",req.user)
  try {
    const userId = req.user.id;
    
    const user = await db.U.findUnique({
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



