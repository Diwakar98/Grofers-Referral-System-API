/*
*   Author: Diwakar Prajapati
*   Entry no: 2018CS10330
*   Date: 28-11-2021
*   Description: 
*       1. API for Grofer's Referral System Prototype
*       2. Very little UI, mostly backend portion
*   Functionalities:
*       1. Registration of User
*       2. Enrolment into Referral System
*       3. Withdraw from Referral System
*       4. Get Referral code which can be shared on social media platforms.
*       5. Give incentives if registered using referral code
*       6. Show Referral history with masked email addresses.
*       7. Show milestone to get cash rewards
*       8. Using Firebase Database
*   
*   How to run:
*       1. Install NodeJS
*       2. Type 'npm run dev' in Command Prompt/Linux Terminal
*/


/*---------------------------------CONNECTION DETAILS----------------------------*/

const referralCodeGenerator = require('referral-code-generator')
const maskEmailsPhones = require('mask-email-phone')
const express  = require('express')
const app = express()

var firebase = require("firebase-admin");
var service = require('./service_key.json');

app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');

//Firebase Databse Connection
firebase.initializeApp({
    credential:firebase.credential.cert(service),
    databaseURL: "https://grofers-a2a4e-default-rtdb.firebaseio.com/"
});

var db = firebase.database();

/*---------------------------------IMPLEMENTATIONAL DETAILS----------------------------*/

/*
    Welcome Page
    How to call:
        Format of the URL:
        localhost:5000/
*/
app.get('/',(req,res) => {
    res.send("<H1>Welcome to Grofer's Referal System");
});



/*
    Get request page for registration of user
    It shows the registration form to be filled by user
    How to call:
        Format of the URL:
        localhost:5000/register
*/
app.get('/register', async (req,res) => {
    res.render("index");
});



/*
    Handeling post request for registration of user
    It first checks if the entered user already exists
    If a similar username has already been registered it show error.
    If the user has entered the referral code then It check is that referral is active.
    If all the condition are satisfied then it registers the user
    No matter user has asked a referral code or not it always creates a referral code and a flag value
    If the user has checked the enrollment for referral code, the flag is true else it is false
    It gives a uniform incentive to both the user: the referall and the referee.
*/
app.post('/register', (req,res) => {
    user = req.body.username;
    pass = req.body.password;
    db.ref("users").orderByChild("username").equalTo(user).once("value",snapshot => {
        if (snapshot.exists()){
            // User name already exists
            var key = Object.keys(snapshot.val())[0];
            res.send("<H2><b>Already Registered</b> <br>Username: "+snapshot.val()[key].username+"<br>Try new Username!<H2>");
        }
        else{
            async function start(){
                var email = req.body.email;
                var uname = req.body.username;
                var pass = req.body.password;
                var referee = req.body.referral;
                var enroll = req.body.enroll;

                /*
                    Referral code generation
                    We make an assumption that the Referral code generated is Unique.
                    Additionally it can be handle to keep generating until we find a non exixsting referral code.
                */
                var referral_code = referralCodeGenerator.alpha('lowercase', 8);
                var incentive = 100;
                var user = {
                    email : email,
                    username : uname,
                    password : pass,
                    referral : referral_code,
                    referral_validity : 1,
                    referees : {},
                    total_incentive : 0
                };
                
                //If user has not asked for enrollment, deactivate it's ID
                if(enroll=='No'){ 
                    user['referral_validity'] = 0;
                }
                
                //Flag to check is the entered referral is valid.
                invalid_referral = false;
                if(referee!=""){
                    await db.ref("users").orderByChild("referral").equalTo(referee).once("value",snapshot1 =>{
                        if(snapshot1.exists()){
                            var key_ = Object.keys(snapshot1.val())[0];
                            var temp = snapshot1.val()[key_];

                            //If referral code is deactive then it cannot be user to register.
                            if(temp["referral_validity"]==1){
                                if(temp['referees']==undefined){
                                    temp['referees'] = {}
                                }
                                temp['referees'][referral_code] = 100;
                                user["referees"][referee] = 100;
                                user['total_incentive'] = 100;
                                temp['total_incentive'] = temp['total_incentive'] + 100;
                                var new_dict = {};
                                new_dict[key_] = temp;
                                db.ref("users").update(new_dict);
                            }
                            else{
                                invalid_referral = true;
                            }
                        }
                        else{
                            invalid_referral = true;
                        }
                    });
                }
                
                if(invalid_referral==false){
                    //Insert newly registered user into database!
                    db.ref('users').push(user);
                    if(enroll=="Yes"){
                        if(referee=="")
                            res.send("<H2><b>Registration Successfull!</b> <br>Email: "+email+"<br>Username: "+uname+"<br>Your Referral Code: "+referral_code+"</H2>");
                        else
                        res.send("<H2><b>Registration Successfull!</b> <br>Email: "+email+"<br>Username: "+uname+"<br>Your Referral Code: "+referral_code+"<br>Referral Code Used:"+referee+" :)</H2>");
                    }
                    else{
                        res.send("<H2><b>Registration Successfull!</b> <br>Email: "+email+"<br>Username: "+uname+"</H2>");
                    }
                }
                else{
                    res.send("<H2>Opps! Invalid Referral Code</H2>");
                }
            }
            start();
        }
    });
});




/*
    Way to enroll into the Grofer's Referral System
    It first checks if the username and password are valid or else shows and error.
    If the username is valid and:
        The user has already been enrolled then it shows message accordingly 
        Or else Enrolls the user and send a JSON response having username and his Referral Code.
    JSON Response Format:
        {
            'username' : 'root',
            'referral' : 'abcdwxyz'
        }
    How to call:
        Format of the URL:
        localhost:5000/enroll_into_referral?username=USERNAME&password=PASSWORD
*/
app.get('/enroll_into_referral',async (req,res)=>{
    var user = req.query.username;
    var pass = req.query.password;
    db.ref("users").orderByChild("username").equalTo(user).once("value",snapshot => {
        if(snapshot.exists()){
            var key_ = Object.keys(snapshot.val())[0];
            var temp = snapshot.val()[key_];

            //Authentication of password
            if(temp['password']==pass){
                var new_dict = {};
                
                //Updating the referral_validity
                if(temp['referral_validity']==0){
                    temp['referral_validity']=1;
                    new_dict[key_] = temp;
                    db.ref("users").update(new_dict);
                    result = {}
                    result['username'] = user;
                    result['referral'] = temp['referral'];
                    res.setHeader('Content-Type', 'application/json');
                    res.send(result);
                }
                else{
                    res.send("<H2>Opps! You have already enrolled into Referral System</H2>");
                }
            }
            else{
                res.send("<H2>Opps! No Such user exists</H2>");
            }
        }
        else{
            res.send("<H2>Opps! No Such user exists</H2>");
        }
    });
});




/*
    Way to withdraw from the Grofer's Referral System
    It first checks if the username and password are valid or else shows and error.
    If the username is valid and:
        The user has already withdraw then it shows message accordingly 
        Or else withdraws the user and shows success.
    How to call:
        Format of the URL:
        localhost:5000/withdraw_from_referral?username=USERNAME&password=PASSWORD
*/
app.get('/withdraw_from_referral',async (req,res)=>{
    var user = req.query.username;
    var pass = req.query.password;
    db.ref("users").orderByChild("username").equalTo(user).once("value",snapshot => {
        if(snapshot.exists()){
            var key_ = Object.keys(snapshot.val())[0];
            var temp = snapshot.val()[key_];

            //Authentication of password
            if(temp['password']==pass){
                var new_dict = {};
                if(temp['referral_validity']==0){
                    res.send("<H2>Opps! You have already withdrawn from Referral System</H2>");
                }
                else{
                    //Updating the validity of referral code
                    temp['referral_validity']=0;
                    new_dict[key_] = temp;
                    db.ref("users").update(new_dict);
                    res.send("<H2> Success! You have withdrawn from Referral System</H2>");
                }
            }
            else{
                res.send("<H2>Opps! No Such user exists</H2>");
            }
        }
        else{
            res.send("<H2>Opps! No Such user exists</H2>");
        }
    });
});



/*
    Way to get user's referral code using username
    It first checks if the username and password are valid or else shows and error.
    Or else return JSON response having username and its referral code
    JSON Response Format:
        {
            'username' : 'root',
            'referral' : 'abcdwxyz'
        }
    How to call:
        Format of the URL:
        localhost:5000/show_referral_code?username=USERNAME&password=PASSWORD
*/
app.get('/show_referral_code',async (req,res)=>{
    var user = req.query.username;
    var pass = req.query.password;
    db.ref("users").orderByChild("username").equalTo(user).once("value",snapshot => {
        if (snapshot.exists()){
            console.log(user);
            var key = Object.keys(snapshot.val())[0];
            var temp = snapshot.val()[key];

            //Authentication of password
            if(temp['password']==pass){
                if(temp['referral_validity']==1){
                    response = {
                        username : snapshot.val()[key].username,
                        referral : snapshot.val()[key].referral
                    };
                    res.setHeader('Content-Type', 'application/json');
                    res.send(response);
                }
                else{
                    res.send("<H2>Opps! You have not enrolled into referral system</H2>");
                }
            }
            else{
                res.send('<H2>Opps! No Such User Exists</H2>');
            }
        }
        else{
            res.send('<H2>Opps! No Such User Exists</H2>');
        }
    });
});



/*
    It first checks if the username and password are valid or else shows and error.
    Using this user can get to know about the number of user who has registered using his referral code.
    If user enters invalid code it shows error
    How to call:
        Format of the URL:
        localhost:5000/show_milestone?username=USERNAME&password=PASSWORD
*/
app.get('/show_milestone', async (req,res) => {
    var user = req.query.username;
    var pass = req.query.password;
    db.ref("users").orderByChild("username").equalTo(user).once("value",snapshot => {
        if (snapshot.exists()){
            var key = Object.keys(snapshot.val())[0];
            var temp = snapshot.val()[key];

            //Authentication of password
            if(temp['password']==pass){
                if(temp['referees']==undefined){
                    res.send("<H2>Total Earned Incentive: Rs. 0<br>No of users register using your referals: 0<br>Next Milestone: 3</H2>");
                }
                else{
                    refrees = snapshot.val()[key]['referees'];
                    //Calculation of next milestone
                    next = (Math.ceil(Object.keys(refrees).length / 4))*4+2;
                    res.send("<H2>Total Earned Incentive: Rs. "+snapshot.val()[key]['total_incentive']+"<br>No of users register using your referals: "+Object.keys(refrees).length+"<br>Next Milestone: "+next+"</H2>");
                }
            }
            else{
                res.send('<H2>Opps! No Such User Exists</H2>');
            }
        }
        else{
            res.send('<H2>Opps! No Such User Exists</H2>');
        }
    });
});


/*
    It first checks if the username and password are valid or else shows an error.
    It shows the email id and their incentives which have registered using user's referral code.
    Return the JSON response:
    Format of JSON:
        {
            'email1@xyz.com' : 100,
            'email2@xyz.com' : 100
            'email3@xyz.com' : 100,
            .
            .
            .
        }
    If the user enters invalid userid, it shows error
    How to call:
        Format of the URL:
        localhost:5000/get_referral_history?username=USERNAME&password=PASSWORD
*/
app.get('/get_referral_history',async (req,res)=>{
    var user = req.query.username;
    var pass = req.query.password;
    db.ref("users").orderByChild("username").equalTo(user).once("value",snapshot => {
        if (snapshot.exists()){
            var key = Object.keys(snapshot.val())[0];
            var temp = snapshot.val()[key];

            //Authentication of password
            if(temp['password']==pass){
                if(temp['referees']==undefined){
                    res.send({});
                }
                else{
                    refrees = snapshot.val()[key]['referees'];
                    result = {}
                    async function start(){
                        for ([key_,value_] of Object.entries(refrees)){
                            await db.ref("users").orderByChild("referral").equalTo(key_).once("value",snapshot1 => {

                                //Getting the email of the users registered using user's referral code
                                //Masking the email addresses 
                                var key2 = Object.keys(snapshot1.val())[0];
                                email = snapshot1.val()[key2]['email'];
                                var masked_email = maskEmailsPhones(email);
                                result[masked_email] = String(value_);
                            });
                        }
                        res.setHeader('Content-Type', 'application/json');
                        res.send(result);
                    }
                    start();
                }
            }
            else{
                res.send('<H2>Opps! No Such User Exists</H2>');
            }
        }
        else{
            res.send('<H2>Opps! No Such User Exists</H2>');
        }
    });
});

/*
    Main function which listens on port 5000 asynchronously.
*/
async function main(){
    await app.listen(5000);
    console.log('Listening Port: 5000 on LocalHost');
};

main();
