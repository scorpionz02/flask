import "dotenv/config.js";
let environment = process.env;
import express from "express";
import pb from "../lib/pb.js";
import cors from "cors";
var router = express.Router();
router.use(cors());

//var smtpTransport = SMTPTransport;
const admin = environment.POCKETBASE_ADMIN;
const password = environment.POCKETBASE_PASSWORD;


async function adminLogin() {
  try {
    let res = await pb.admins.authWithPassword(admin, password);
    return res;
  } catch (error) {
    return false;
  }
}



router.get("/tahlillerim", async (req, res) => {
  
    res.json({
      
      status: true,
    });
});





export default router;


