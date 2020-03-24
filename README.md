# Rasa-Rocket.Chat-Plugin

### Demo
[DEMO](https://drive.google.com/file/d/1wPAW_HIHr_XOA6MmezcAnAOE4pQgRAWh/view?usp=sharing)

### Installation steps:

 1. Clone this repo and Change Directoy: </br>
 `git clone https://github.com/murtaza98/RASA-Rocket.Chat-Plugin.git && cd RASA-Rocket.Chat-Plugin/`
 
 2. Install the required packages from `package.json`: </br>
	 `npm install`

 3. Deploy Rocket.Chat app: </br>
    `rc-apps deploy --url http://localhost:3000 --username user_username --password user_password`
    Where:
    - `http://localhost:3000` is your local server URL (if you are running in another port, change the 3000 to the appropriate port)
    - `user_username` is the username of your admin user.
    - `user_password` is the password of your admin user.
    
    For more info refer [this](https://rocket.chat/docs/developer-guides/developing-apps/getting-started/) guide

### Rocket.Chat Apps Setup   

1. First go ahead n create a Bot User. Goto `Setting > Users`. This new user should have these 2 roles.</br>
    1. bot
    2. livechat-agent

2. Then configure the app to automatically assign a livechat-visitor to this bot. To do so, goto `Setting > Livechat > Routing`. There enable `Assign new conversations to bot agent` Setting.

3. Then create a new Department from Livechat Admin Panel, n assign the above created user to this department.

4. Lastly, the app needs some configurations to work, so to setup the app Go to `Setting > Apps > RASA-Plugin`. There, fill all the necessary fields in `SETTINGS` and click SAVE. Note all fields are required. 
    
    Some of the fields in `SETTING` include    
    1. RASA Server URL
        - Here enter the RASA url where the RASA server is hosted.
        - Make sure to add `/webhooks/rest/webhook` to the url
        - example:</br> http://efee760b.ngrok.io/webhooks/rest/webhook
    2. LiveChat Bot Username
        - This should contain the same bot username which we created above in Step 1
    3. LiveChat Bot Password
        - Password for the above username
    4. Handover Target Department Name
        - Enter the department name where a visitor will be transfered upon handover.
        - Please make sure that this department should not contain the Bot User we created in Step 1, otherwise the handover feature won't work. 


### Some additional Configs for RASA  
 - [Here's](https://medium.com/analytics-vidhya/learn-how-to-build-and-deploy-a-chatbot-in-minutes-using-rasa-5787fe9cce19) a sample RASA application tutorial for testing. After setting up a RASA server, u will have to change the server's URL in [RasaPluginApp.ts](https://github.com/murtaza98/RASA-Rocket.Chat-Plugin/blob/master/RasaPluginApp.ts) file.
 - To enable the RASA API use the following command:</br>
 `python -m  rasa_core.run -d models/current/dialogue -u models/current/nlu --endpoints endpoints.yml --enable_api --cors “*” --debug`

### TODO's    
 - add sync handover feature
 - add async handover feature
