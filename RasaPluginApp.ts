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
import { ILivechatMessage, ILivechatRoom, IVisitor, ILivechatTransferData } from '@rocket.chat/apps-engine/definition/livechat';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

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
        const SettingBotUsername: string = (await read.getEnvironmentReader().getSettings().getById('Lc-Bot-Username')).value;
        const SettingBotPassword: string = (await read.getEnvironmentReader().getSettings().getById('Lc-Bot-Password')).value;
        const targetDeptName: string = (await read.getEnvironmentReader().getSettings().getById('Handover-Target-Department-Name')).value;

        if (message.sender.username === SettingBotUsername) {
            return;
        } else if (message.room.type !== 'l') {
            return;
        }

        const lmessage: ILivechatMessage = message;
        const lroom: ILivechatRoom = lmessage.room as ILivechatRoom;
        let lBotUser: IUser = message.sender; // tmp assignment since lroom.servedBy can be undefined
        if (lroom.servedBy) {
            lBotUser = lroom.servedBy;
        }

        // Debug
        // this.getLogger().log(`app.${ this.getNameSlug() }`);
        this.getLogger().log('message sent by username --> ' + message.sender.username);
        this.getLogger().log('Room type --> ' + message.room.type);
        this.getLogger().log('roles --> ' + message.sender.roles);
        this.getLogger().log('served by --> ' + lBotUser.username);

        if (SettingBotUsername !== lBotUser.username) {
            return;
        }

        // CHECK HANDOVER
        if (message.text === 'perform_handover') {
            this.getLogger().log('handover action start');
            // http_request_no_1 ---> perform authentication
            const authHttpRequest: IHttpRequest = {
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {
                    user: SettingBotUsername,
                    password: SettingBotPassword,
                },
            };

            http.post('http://localhost:3000/api/v1/login', authHttpRequest).then(
                (loginResponse) => {
                    // console.log(loginResponse.content);
                    const loginResponseJSON = JSON.parse((loginResponse.content || '{}'));
                    console.log('loginResponseJSON.data.userId --> ' + loginResponseJSON.data.userId);
                    console.log('loginResponseJSON.data.authToken --> ' + loginResponseJSON.data.authToken);
                    console.log('message.room.id --> ' + message.room.id);

                    const deptHttpRequest: IHttpRequest = {
                        headers: {
                            'X-Auth-Token': loginResponseJSON.data.authToken,
                            'X-User-Id': loginResponseJSON.data.userId,
                        },
                    };
                    // http_request_no_2 --> get department id
                    http.get('http://localhost:3000/api/v1/livechat/department', deptHttpRequest).then(
                        (deptResponse) => {
                            const deptResponseJSON = JSON.parse((deptResponse.content || '{}'));
                            // console.log(deptResponseJSON);
                            let targetDeptId: string = '';
                            deptResponseJSON.departments.forEach(
                                (department) => {
                                    if (department.name === targetDeptName) {
                                        targetDeptId = department._id;
                                    }
                                },
                            );

                            console.log('Target Dept Id --> ' + targetDeptId);

                            // http_request_no_3 --> make handover request
                            const ForwardHttpRequest: IHttpRequest = {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Auth-Token': loginResponseJSON.data.authToken,
                                    'X-User-Id': loginResponseJSON.data.userId,
                                },
                                data: {
                                    roomId: message.room.id,
                                    departmentId: targetDeptId,
                                },
                            };
                            http.post('http://localhost:3000/api/v1/livechat/room.forward', ForwardHttpRequest).then(
                                (forwardResponse) => {
                                    console.log('room.forward response --> ' + forwardResponse);
                                },
                            );
                        },
                    );
                },
            );
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
                // TODO:- Add appropriate session Key in sender field
                sender: 'test_user_' + this.randomInt(1, 100000),     // create a random session key
                message: message.text,
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
                builder.setRoom(message.room).setText(concatMessage).setSender(lBotUser);
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
        const LcBotUsername: ISetting = {
            id: 'Lc-Bot-Username',
            public: true,
            type: SettingType.STRING,
            packageValue: '',
            i18nLabel: 'Livechat Bot Username',
            required: true,
        };
        const LcBotPassword: ISetting = {
            id: 'Lc-Bot-Password',
            public: true,
            type: SettingType.STRING,
            packageValue: '',
            i18nLabel: 'Livechat Bot Password',
            required: true,
        };
        const HandoverTargetDepartmentName: ISetting = {
            id: 'Handover-Target-Department-Name',
            public: true,
            type: SettingType.STRING,
            packageValue: '',
            i18nLabel: 'Handover Target Department Name',
            required: true,
        };
        configuration.settings.provideSetting(RasaServerISetting);
        configuration.settings.provideSetting(LcBotUsername);
        configuration.settings.provideSetting(LcBotPassword);
        configuration.settings.provideSetting(HandoverTargetDepartmentName);
    }
}
