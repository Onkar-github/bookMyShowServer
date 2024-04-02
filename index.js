let express = require("express");
let app = express();
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt

let { seatList } = require("./seat");
let { movies } = require("./models");

app.use(express.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin , X-Requested-With , Content-Type , Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET , PUT , POST , DELETE");
    next();
})

app.use(passport.initialize());

let port = process.env.PORT || 2410 ;
app.listen(port, () => console.log(`Node app is listening on port ${port}!`));

const jwt_key = "jwtsecret993862";

let users = [
    { fName: "Test", lName: "", email: "test@test.com", number: "9811578656", married: "No" },
]

booking = [];

let params = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwt_key,
}

let strategyUser = new JwtStrategy(params, function (token, done) {
    console.log("In jwtStrategy-user token ", token);
    let user = users.find((f1) => f1.email === token.email);

    if (!user)
        return done(null, false, { message: "Token Get Expired! login again..." });
    else
        return done(null, user);
})

passport.use("user", strategyUser);


app.post("/login", function (req, res) {
    let { email } = req.body;
    console.log("get email", email)
    let user = users.find((user) => user.email === email);
    console.log("/login ->< user", user)
    if (user) {
        let payload = { email: user.email };
        const token = jwt.sign(payload, jwt_key, {
            algorithm: "HS256",
            expiresIn: '1h',
        })
        res.send({ token: "bearer " + token, email: user.email },);
    }
    else res.status(401).send("Login failed. Try again!");
})

app.get("/movies/:city", function (req, res) {
    let city = req.params.city;
    let q = req.query.q;
    let lang = req.query.lang;
    let format = req.query.format;
    let genre = req.query.genre;

    let movies2 = movies.find((m1) => m1.location === city).movieList;

    if (q) movies2 = movies2.filter((m2) => m2.title.toLowerCase() === q.toLowerCase());
    if (lang) {
        let arr = lang.split(",");
        movies2 = movies2.filter((m2) => arr.find((a1) => a1 === m2.language));
    }
    if (format) {
        let arr = format.split(",");
        movies2 = movies2.filter((m2) => arr.find((a1) => m2.format.includes(a1)));
    }
    if (genre) {
        let arr = genre.split(",");
        movies2 = movies2.filter((m2) => arr.find((a1) => m2.genre.includes(a1)));
    }
    res.send(movies2);
})

app.get("/movies/:city/:name", function (req, res) {
    let city = req.params.city;
    let name = req.params.name;
    let movies2 = movies.find((m1) => m1.location === city).movieList;
    let movie = movies2.find((m2) => m2.title.toLowerCase() === name.toLowerCase());
    movie ? res.send(movie) : res.status(404).send("No Such movie available");
})

app.get("/app/seats", function (req, res) {
    res.send(seatList);
});

app.post("/seat", (req, res) => {
    let data = req.body;
    console.log("ticket data", data);
    let ele = booking.find((f1) => JSON.stringify(f1) === JSON.stringify(data));
    if (!ele)
        booking.push(data);

    console.log("booking", booking, "ele", ele);
    res.send(data);
})

app.get("/user", passport.authenticate("user", { session: false }), function (req, res) {
    console.log("/user , GET", req.user);
    res.send({ user: req.user });
})

app.put("/user", passport.authenticate("user", { session: false }), function (req, res) {
    let body = req.body;
    console.log("/user , PUT", req.user);
    let index = users.findIndex((user) => user.email === req.user.email);

    if(index>=0) {
        users[index] = { ...users[index], ...body };
        console.log("respone ", users[index]);
        res.send( {msg : "Details Successfully Updated" , email : users[index].email });
    }
    else res.send({msg : "User not found"} )
})

app.get("/user/booking", passport.authenticate("user", { session: false }), function (req, res) {
    console.log("/user/booking , GET", req.user);
    let obj = { user: req.user, booking: booking };
    res.send(obj);
})