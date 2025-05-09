import bcrypt from "bcryptjs"
import { db } from "../libs/db.js"
import jwt from "jsonwebtoken"
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { UserRole } from "../generated/prisma/index.js"
import dotenv from "dotenv";

dotenv.config();
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import {
  emailVerificationConfirmationContent,
  emailVerificationContent,
  resendEmailVerificationContent,
  resetPasswordEmailContent,
  sendMail,
} from "../utils/mail.js";
 
import { text } from "express";



const userRegister = asyncHandler(async(req,res) =>{
  console.log("hit user register")
const{name, email,password}=req.body;

const hashedPassword = await bcrypt.hash(password,10);

const existingUser = await db.User.findUnique({ where: {email}});
if(existingUser)
  throw new ApiError(409,"Validation failed", ["User already exist"]);

const token = crypto.randomBytes(62).toString("hex");
const hashedToken=crypto.createHash("sha256").update(token).digest("hex");
const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000)

const newUser = await db.User.create({
data: {
  email,
  password:hashedPassword,
  name,
  verificationToken:hashedToken,
  verificationTokenExpiry:tokenExpiry,
  role: UserRole.USER

}


})

console.log(newUser)
if(!newUser.verificationToken && !newUser.verificationTokenExpiry){
  throw new ApiError(400,"User registration is failed",[
    "Verification token failed",
    "Verification token expiry failed"
  ])
}


const verificationURL = `${process.env.BASE_URL}/api/v1/auth/verify/${token}`;
  try {
    await sendMail({
      email: newUser.email,
      subject: "User Verification Email",
      mailGenContent: emailVerificationContent(name, verificationURL),
    });
  } catch (err) {
    console.error("Email sending error:", err); // Add this line
  throw new ApiError(400, "Email Verification Confirmation email not sent");
  }

  res
  .status(200)
  .json(
    new ApiResponse(
      200,
      "User is registered and Verification Email sent successfully",
    ),
  );

})

const verifyUser = asyncHandler(async(req,res) =>{
  console.log("hit the Verify user")
  const { token } = req.params;
  

  if(!token){
    throw new ApiError(404,"Token not found");
  }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    


    const userToVerify = await db.User.findFirst({

      where: {
        verificationToken: hashedToken,
        verificationTokenExpiry: {
          gt: new Date()
        }
      }
    });
    


const name = userToVerify.name

if(userToVerify.verificationTokenExpiry < Date.now()){
  throw new ApiError(404,"token expire")
}

if(!userToVerify){
  throw new ApiError(404,"User not found.Maybe Token is invalid")
}

await db.User.update({
  where : {
    id:userToVerify.id,
  },
  data : {
    verificationToken:null,
    isVerified:true,
    verificationTokenExpiry:null,
  }
});

try{
  await sendMail({
    email:userToVerify.email,
    subject: "Email Verification Confirmation",
    mailGenContent: emailVerificationConfirmationContent(name),
  })
} catch(error){
  throw new ApiError(400,"Email Verification Confirmation email not sent")
}

return res
.status(200).json(new ApiResponse(200,"User is verified"))


})

const resendverificationemail = asyncHandler(async(req,res) =>{

  const {email} = req.body;
  const userToVerify = await db.User.findUnique({
    where : {
      email
    }
  });
  if(!userToVerify){
    throw new ApiError(404,"User not found. Please register your account")
  }

  if(userToVerify.isVerified){
    throw new ApiError(400,"User is Already verified ")
  }

  const token = crypto.randomBytes(62).toString("hex" );
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await db.User.update({
  where : {
    id :userToVerify.id,
  },
  data : {
    verificationToken:hashedToken,
    verificationTokenExpiry:tokenExpiry,
  }
    

  })

  const name = userToVerify.name;

  const verificationURL = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

  try {
    await sendMail({
      email:userToVerify.email,
      subject : "User Resend Verification Email",
      mailGenContent:resendEmailVerificationContent(name,verificationURL)

    })
    
  } catch (err) {
    throw new ApiError(400,"Email Verification failed",err)
    
  }

  return res
    .status(200)
    .json(new ApiResponse(200,"User verification Email Sent Successfully"))


}


)

const loginUser = asyncHandler(async(req,res) =>{
const{email,password} = req.body;
const loggedinUser = await db.User.findUnique({
  where : {
    email
  }
})
if(!loggedinUser){
  throw new ApiError(404,"Email or Password is incorrect")
}

const isValid = await bcrypt.compare(password,loggedinUser.password)
if(!isValid){
  throw new ApiError(404,"Email or Password is incorrect")
}


const refreshToken = jwt.sign(
  {
    id:loggedinUser.id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {expiresIn : "15m"}
)


const accessToken = jwt.sign(
  {
    id:loggedinUser.id,
    password:loggedinUser.password,
    email:loggedinUser.email,
  },
  process.env.ACCESS_TOKEN_SECRET,
  {expiresIn : "15m"}
)

const accessTokenCookieOptions ={
  httpOnly:true,
  secure : process.env.NODE_ENV === "production",
  sameSite : "lax",
  maxAge : 10 * 60 * 1000
}

res.cookie("AccessToken",accessToken,accessTokenCookieOptions);

const refreshTokenCookieOptions = {
  httpOnly:true,
  secure:process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge : 20 * 60 * 1000,
}

res.cookie("RefreshToken",refreshToken,refreshTokenCookieOptions);

loggedinUser.refreshToken=refreshToken;
await db.User.update({
  where : {
    id:loggedinUser.id,
  },
  data: {
    refreshToken:refreshToken,
  }
})
res.status(200).json(new ApiResponse(200,"User is logged In"))



})


const getProfile = asyncHandler(async(req, res) =>{
  const loggedinUser= await db.User.findUnique(
    {
      where : {
        id:req.user.id
      }
    }
  )
  if(!loggedinUser) {
    throw new ApiError(404, "User is logged Out");
  }

  return res.status(200).json(new ApiResponse(200,"You are on Profile Page"))

})


const logOut = asyncHandler(async (req, res) =>{
  
const loggedinUser = await db.User.findUnique({
  where : {
    id: req.user.id
  }
})

if(!loggedinUser){
  throw new ApiError(404,"User not found")
}

const accessTokenCookieOptions = {
  httpOnly: true,
  secure : process.env.NODE_ENV === "production",
  sameSite : "lax",
}

res.clearCookie("AccessToken", accessTokenCookieOptions);
const refreshTokenCookieOptions = {
  httpOnly : true,
  secure: process.env.NODE_ENV === "production",
  sameSite : "lax",
  maxAge :20 * 60 * 1000,
}
res.clearCookie("RefreshToken", refreshTokenCookieOptions);
return res.status(200).json(new ApiResponse(200, "User is loggedOut"))

})

const forgotPass = asyncHandler(async(req,res) =>{
  const { email } = req.body;
  const user = await db.User.findUnique({
    where : {
      email
    }
  })

if(!user){
  throw new ApiError(404,"User not found");
}
const name = user.name;

const token = crypto.randomBytes(62).toString("hex");
const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

await db.User.update({
  where : {id: user.id},
  data : {
    forgotPasswordToken:hashedToken,
    forgotPasswordExpiry : tokenExpiry,
  }
})
 
const resetPassUrl = `${process.env.BASE_URL}/api/v1/forgotPass/${token}`;

await sendMail({
  email:user.email,
  subject: "Reset Password Email",
  mailGenContent:resetPasswordEmailContent(name,resetPassUrl)
})

res.status(200).json(new ApiResponse(200,"Email sent Successfully"))

})


const resetPass = asyncHandler(async(req,res) =>{
  const { token } = req.params;
  const{ password, confirmPassword} = req.body;
  if(!token){
    throw new ApiError(404,"Token not found")
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const resetPassUser = await db.User.findUnique({
    where : {
      forgotPasswordToken : hashedToken,
      forgotPasswordExpiry : { gt:new Date()}
    }
  })

  if(!resetPassUser){
    throw new ApiError(404, "User not found");
  }

  const bcryptPass = await bcrypt.hash(password,10);
  
  await db.User.update({
    where : {
      id: resetPassUser.id
    },
    data: {
      forgotPasswordToken:null,
      forgotPasswordExpiry:null,
      password:bcryptPass
    }
  })
return res.status(200).json(new ApiResponse(200,"Password changes SuccessFylly"))

})

const resetCurrentPass = asyncHandler(async(req,res) =>{
  const {password,confirmPassword} = req.body;
  const loggedinUser = await db.User.findUnique( {
    where : {id : req.user.id}
  })

if(!loggedinUser){
  throw new ApiError(404,"User not found");
}

const bcryptPass = await bcrypt.hash(password,10);

await db.User.update({
  where : {
    id:loggedinUser.id
  },
  data : {
   password:bcryptPass
  }
})

return res.status(200).json(new ApiResponse(200,"Password changed Successfully"))



})


export {
  userRegister,
   verifyUser,
   resendverificationemail,
   loginUser,
   logOut,
   getProfile,
  forgotPass,
  resetPass,
  resetCurrentPass,
};