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

### Some additional Configs  
 - [Here's](https://medium.com/analytics-vidhya/learn-how-to-build-and-deploy-a-chatbot-in-minutes-using-rasa-5787fe9cce19) a sample RASA application tutorial for testing. After setting up a RASA server, u will have to change the server's URL in [RasaPluginApp.ts](https://github.com/murtaza98/RASA-Rocket.Chat-Plugin/blob/master/RasaPluginApp.ts) file.
 - To enable the RASA API use the following command:</br>
 `python -m  rasa_core.run -d models/current/dialogue -u models/current/nlu --endpoints endpoints.yml --enable_api --cors “*” --debug`

### TODO's    
 - add settings to RC app
 - handover feature

