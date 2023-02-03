const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
let refreshTokens = [];
port=3000;
app.use(express.json());




app.post("/login", function(req, res) {
    let userCredentials = {
        user: 'boss',
        password: 'boss123',
        email: 'boss@gmail.com'
    }
    let { user, password } = req.body;
 if (!user) {
    return res.status(404).json({ message: "User must be in body" });
  }

  let accessToken = jwt.sign(user, "access", { expiresIn: "30s" });
  let refreshToken = jwt.sign(user, "refresh", { expiresIn: "7d" });
  refreshTokens.push(refreshToken);

  return res.status(201).json({accessToken, refreshToken,
  });
});

//middleware to authenticate
const authenticate = async (req, res, next) => {
  let token = req.headers["x-api-key"];

  jwt.verify(token, "access", async (err, user) => {
    if (user) {
      req.user = user;
      next();
    } else if (err.message === "jwt expired") {
      return res.json({ success: false, message: "access token expired" });
    } else {
      console.log(err);
      return res.status(403).json({ err, message: "Forbidden" });
    }
  });
};

// Protected route, can only be accessed when user is logged-in
app.post("/protected", authenticate, (req, res) => {
  return res.json({ message: "Protected content!" });
});

//create a new accessToken using refreshToken
app.post("/refresh", (req, res) => {
  let refreshToken = req.body.token;
  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.json({ message: "refresh token not found, login again" });
  }

  jwt.verify(refreshToken, "refresh", (err, user) => {
    if (!err) {
      let accessToken = jwt.sign({ username: user.name }, "access", {
        expiresIn: "20s",
      });
      return res.json({ success: true, accessToken });
    } else {
      return res.json({ success: false, message: "invalid refresh token" });
    }
  });
});

app.listen (port, () => {
  console.log(`express app running on port ${port}`);
});