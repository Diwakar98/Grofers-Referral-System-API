# Grofers-Referral-System-API
API for Referral System

## Functionalities:
  - Registration of User.
  - Enrolment into Referral System.
  - Withdraw from Referral System.
  - Get Referral code which can be shared on social media platforms.
  - Give incentives if registered using referral code.
  - Show Referral history with masked email addresses.
  - Show milestone to get cash rewards.

## Framework Used: ***NodeJS***
## Database Used: ***Firebase Readtime Database***

## How to run:
  - Install NodeJS
  - Type 'npm run dev' in Command Prompt/Linux Terminal.
  - Search 'localhost:5000' in the browser.

## Libraries Used:
  - Express: To make a web application.
  - Referral-code-generator: To generate referral code for registered users.
  - Mask-email-phone : To mask the email addresses.
  - Firebase-admin: To connect to Google’s Firebase Database.
  
## Assumptions:
  - We make an assumption that the referral code being generated using the referral code generator is always unique. Although we can extend the implementation to always make a unique referral code.
  - The code runs on a local machine. Although the database we are using if Google’ FIrebase database and it is a global realtime database. We can deploy the code on a server to access globally.

### Note: Focused mostly on the backend part rather than frontend.

## API details
  - ### HomePage: localhost:5000/
  - ### Get Referral Code
      - To get the personalized referral code for the user. Users can get this Code and share on Social Media platforms etc.
      - Users have to first register before getting the referral code.
      - For already registered users to get their referral code:
      
      - API: **localhost:5000/show_referral_code?username=USERNAME&password=PASSWORD**
      - Details:
          - Way to get user's referral code using username
          - It first checks if the username and password are valid or else shows an error.
          - Or else return JSON response having username and it's referral code
          - JSON Response Format:
           {
              'username' : 'root',
              'referral' : 'abcdwxyz'
           }
      - **app.get('/show_referral_code',async (req,res)=>{ . . . }**

  - ### Register
      - API which allows users to sign up with referral code and give incentives to both referee and referred user.
	    - Give Rs. 100 incentive to both the register user and the referee if registered using Referral Code.
	   
      - SignUp API: **localhost:5000/register**
      - Details:
          - Get request page for registration of user
          - It shows the registration form to be filled by user
      - **app.post('/register', (req,res) => { . . . }**
 
  - ### Get Referral History
      - API which allows users to get their referral history and the incentives.
	    - Referral History API:: **localhost:5000/get_referral_history?username=USERNAME&password=PASSWORD**
      - Details:
          - It first checks if the username and password are valid or else shows an error.
          - It shows the email id and their incentives which have registered using the user's referral code.
          - If the user enters invalid userid, it shows error
          - Return the JSON response: 
              {
                'email1@xyz.com' : 100,
                'email2@xyz.com' : 100
                'email3@xyz.com' : 100,
                .
                .
                .
              }



      - **app.get('/get_referral_history',async (req,res)=>{ . . . }**










