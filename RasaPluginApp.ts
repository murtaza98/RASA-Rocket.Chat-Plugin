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
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

export class RasaPluginApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(): Promise<void> {
        this.getLogger().log('App Initialized');
    }

    public async executePostMessageSent(
        message: IMessage, read: IRead, http: IHttp, persistence: IPersistence,
        modify: IModify): Promise<void> {
        // Debug
        // this.getLogger().log(`app.${ this.getNameSlug() }`);
        // this.getLogger().log(message.sender.username);
        if (message.sender.username === `app.${ this.getNameSlug() }`) {
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

        http.post('http://03e59c28.ngrok.io/webhooks/rest/webhook', httpRequest).then(
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
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
