import {
    IAppAccessors,
    IHttp,
    IHttpRequest,
    IHttpResponse,
    ILogger,
    IMessageBuilder,
    IModify,
    IPersistence,
    IRead,
    IConfigurationExtend,
    IEnvironmentRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export class RasaPluginApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        this.getLogger().log('App Initialized');
    }

    public async executePostMessageSent(
        message: IMessage, read: IRead, http: IHttp, persistence: IPersistence,
        modify: IModify): Promise<void> {
        // Debug
        // this.getLogger().log(`app.${ this.getNameSlug() }`);
        this.getLogger().log(message.sender.username);
        this.getLogger().log("Room type--> " + message.room.type);
        this.getLogger().log("roles--> " + message.sender.roles);
        if (message.sender.username === `app.${ this.getNameSlug() }`) {
            return;
        } else if (message.room.type === 'l' && message.sender.roles && message.sender.roles.indexOf('livechat-agent') > -1) {
            // it is livechat agent message
            return;
        } else if (message.room.type !== 'l') {
            // not a livechat room message
            return;
        }



        // --> content of post message
        // {
        // "sender": "test_user_1",
        // "message": "give me details regarding the latest match"
        // }

        const httpRequest: IHttpRequest = {
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                'sender': 'test_user_' + this.randomInt(1, 100000),     // create a random session key
                'message': message.text,
            },
        };

        const RasaServerURL: string = (await read.getEnvironmentReader().getSettings().getById('RASA-Server-URL')).value;

        http.post(RasaServerURL, httpRequest).then(
            (response) => {
                this.getLogger().log('resolved');
                console.log('-----------------------------' + (response.content || 'empty response'));

                const responseJSON = JSON.parse((response.content || '{}'));
                let concatMessage: string = '';

                responseJSON.forEach(
                    (recievedMessage) => {
                        concatMessage += recievedMessage.text + '\n\n\n';
                        console.log(recievedMessage.text);
                    },
                );

                const builder = modify.getNotifier().getMessageBuilder();
                builder.setRoom(message.room).setText(concatMessage);
                modify.getCreator().finish(builder);
            },
        ).catch(
            (error) => this.getLogger().log('error'),
        );
    }

     /**
     * generate a random integer between min and max
     * @param {Number} min
     * @param {Number} max
     * @return {Number} random generated integer
     */
    protected randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        const RasaServerISetting: ISetting = {
            id: 'RASA-Server-URL',
            public: true,
            type: SettingType.STRING,
            packageValue: '',
            i18nLabel: 'RASA Server URL',
            required: true,
        };
        configuration.settings.provideSetting(RasaServerISetting);
    }
}
