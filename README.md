# Robust Auth System - Backend
This is a generic authentication and authorization system that can be used in any MERN stack projects. The frontend micrservice is available at [Robust Auth System - Frontend](https://github.com/sabareeshs786/robust-auth-system-ui) Go to bottom to see the features implemented in this Node.Js application

---
## Requirements

For development, you will only need Node.js and a node global package, npm, installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###

## Install

    $ git clone https://github.com/sabareeshs786/robust-auth-system-backend
    $ cd robust-auth-system-backend
    $ npm install

## Configure app

Open `.env` file then inject your credentials so it looks like this

    PORT=<PORT_NO>
    ACCESS_TOKEN_SECRET=<ACCESS_TOKEN_SECRET>
    REFRESH_TOKEN_SECRET=<REFRESH_TOKEN_SECRET>
    MFA_SECRET_KEY=<MFA_SECRET_KEY>
    MFA_SECRET_IV=<MFA_SECRET_IV>
    DATABASE_URI=<YOUR_CLOUD_MONGODB_URI_FROM_MONGODB_ATLAS>
    ADMIN_EMAIL_ID=<YOUR_ADMIN_EMAIL_ID>
    ADMIN_PASSWORD=<YOUR_PASSWORD>
    EMAIL_ID=<YOUR_EMAIL_ID>
    PASSWORD=<YOUR_PASSWORD>
    AWS_ACCESS_KEY=<YOUR_AWS_ACCESS_KEY>
    AWS_SECRET_KEY=<YOUR_AWS_SECRET_KEY>
    AWS_REGION=<YOUR_AWS_REGION>
    TEST_EMAIL_ID=<YOUR_TEST_EMAIL_ID>

## How to obtain credentials to add to the above `.env` file

### To obtain the ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET run the following command:

    $ node
    > require('crypto').randomBytes(64).toString('hex')

### To obtain MFA_SECRET_KEY run the following command:

    $ node
    > require('crypto').randomBytes(32).toString('base64')

### To obtain MFA_SECRET_IV run the following command:

    $ node
    > require('crypto').randomBytes(16).toString('base64')

### To obtain DATABASE_URI refer to https://www.youtube.com/watch?v=UrjZ3qn44uE Sample DATABASE_URI will look as follows:

    DATABASE_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

### To obtain PASSWORD login to your EMAIL_ID which should be a gmail id and get an App password from your account after enabling 2-step verification. 

  Refer to this youtube video https://www.youtube.com/watch?v=hXiPshHn9Pw to get the app password. This app password is the PASSWORD that must be entered for the corresponding EMAIL_ID which is a gmail id. From this gmail id only the verifications codes will be sent for the verification purposes such as verifying email ids while signing up, resetting password etc.,

### To obtain AWS_ACCESS_KEY, AWS_SECRET_KEY for the purpose of sending SMS to the phone numbers using AWS SNS refer to https://www.youtube.com/watch?v=18LSoIt7hKY 

  In order to send/receive SMS through AWS SNS, you have to add your phone number to the Sandbox destination phone numbers under Mobile -> Text messaging (SMS) in Amazon SNS management console.

#### Note: ADMIN_EMAIL_ID, TEST_EMAIL_ID should be your email addresses and ADMIN_PASSWORD can be anything. 

## Running the project

    $ npm run dev

## Simple build for production

    $ npm start

## Features implemented

  - ### Authentication using Email address and password
  - ### Verification of the email address that is entered while signing up with the 6-digit verification code
  - ### Sending the 6-digit verification to the entered email address from the pre-configured email address in the application
  - ### Allowing the user to login strictly after verification is successful
  - ### Resetting password is possible after verifying the identity with verification code sent to the registered email address
  - ### Multi-factor Authentication is also implemented
  - ### Authenticator app can be used for the MFA after scanning the QR code that is displayed and entering the 6-digit code
  - ### User email address can also be used for the MFA. The 6-digit verification code will be sent to registered email address whenever a login is attempted
  - ### To disable MFA, the identity of the user is verified again with the verification code that is sent to the registered email address of the user
