/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MessageController } from './../controllers/message.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GroupController } from './../controllers/group.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/auth.controller';
import { expressAuthentication } from './../middlewares/authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "LastMessageDto": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "image": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"},{"dataType":"undefined"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IUserDTO.Exclude_keyofIUserDTO.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true},"fullname":{"dataType":"string","required":true},"profilePic":{"dataType":"string","required":true},"_id":{"dataType":"string","required":true},"createdAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true},"updatedAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserResponseDtoWithLastMessage": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "fullname": {"dataType":"string","required":true},
            "profilePic": {"dataType":"string","required":true},
            "_id": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true},
            "lastMessage": {"dataType":"union","subSchemas":[{"ref":"LastMessageDto"},{"dataType":"undefined"}],"required":true},
            "unreadCount": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"undefined"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "mongoose.Types.ObjectId": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReactionDto": {
        "dataType": "refObject",
        "properties": {
            "emoji": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageResponseDto": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "text": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "image": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "senderId": {"ref":"mongoose.Types.ObjectId","required":true},
            "receiverId": {"ref":"mongoose.Types.ObjectId","required":true},
            "isRead": {"dataType":"boolean","required":true},
            "reactions": {"dataType":"array","array":{"dataType":"refObject","ref":"ReactionDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserResponseDto": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "fullname": {"dataType":"string","required":true},
            "profilePic": {"dataType":"string","required":true},
            "_id": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SearchMessageResultDto": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"datetime"}],"required":true},
            "text": {"dataType":"string","required":true},
            "senderId": {"ref":"mongoose.Types.ObjectId","required":true},
            "receiverId": {"ref":"mongoose.Types.ObjectId","required":true},
            "otherUser": {"ref":"UserResponseDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GroupLastMessageDto": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "image": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "senderName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IUserDTO.fullname-or-profilePic_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"fullname":{"dataType":"string","required":true},"profilePic":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GroupMemberDto": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_IUserDTO.fullname-or-profilePic_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GroupResponseDto": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "name": {"dataType":"string","required":true},
            "avatar": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "ownerId": {"ref":"mongoose.Types.ObjectId","required":true},
            "members": {"dataType":"array","array":{"dataType":"refAlias","ref":"GroupMemberDto"},"required":true},
            "lastMessage": {"dataType":"union","subSchemas":[{"ref":"GroupLastMessageDto"},{"dataType":"undefined"}],"required":true},
            "unreadCount": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateGroupBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "memberIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GroupMessageResponseDto": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "groupId": {"ref":"mongoose.Types.ObjectId","required":true},
            "senderId": {"ref":"mongoose.Types.ObjectId","required":true},
            "text": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "image": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
            "reactions": {"dataType":"array","array":{"dataType":"refObject","ref":"ReactionDto"},"required":true},
            "readBy": {"dataType":"array","array":{"dataType":"refAlias","ref":"mongoose.Types.ObjectId"},"required":true},
            "sender": {"ref":"GroupMemberDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SearchGroupMessageResultDto": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "text": {"dataType":"string"},
            "senderId": {"dataType":"string","required":true},
            "groupId": {"dataType":"string","required":true},
            "groupName": {"dataType":"string","required":true},
            "senderName": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUser": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "fullname": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "profilePic": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IUser.email-or-password_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"password":{"dataType":"string","required":true},"email":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsMessageController_getUsersList: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/message/getUsersListWithoutCurrentUser',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MessageController)),
            ...(fetchMiddlewares<RequestHandler>(MessageController.prototype.getUsersList)),

            async function MessageController_getUsersList(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMessageController_getUsersList, request, response });

                const controller = new MessageController();

              await templateService.apiHandler({
                methodName: 'getUsersList',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMessageController_getMessages: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/message/getMessages/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MessageController)),
            ...(fetchMiddlewares<RequestHandler>(MessageController.prototype.getMessages)),

            async function MessageController_getMessages(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMessageController_getMessages, request, response });

                const controller = new MessageController();

              await templateService.apiHandler({
                methodName: 'getMessages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMessageController_markRead: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"messageIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/message/markRead',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MessageController)),
            ...(fetchMiddlewares<RequestHandler>(MessageController.prototype.markRead)),

            async function MessageController_markRead(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMessageController_markRead, request, response });

                const controller = new MessageController();

              await templateService.apiHandler({
                methodName: 'markRead',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMessageController_search: Record<string, TsoaRoute.ParameterSchema> = {
                q: {"in":"query","name":"q","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/message/search',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MessageController)),
            ...(fetchMiddlewares<RequestHandler>(MessageController.prototype.search)),

            async function MessageController_search(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMessageController_search, request, response });

                const controller = new MessageController();

              await templateService.apiHandler({
                methodName: 'search',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMessageController_postMessage: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                text: {"in":"formData","name":"text","dataType":"string"},
                image: {"in":"formData","name":"image","dataType":"file"},
        };
        app.post('/message/postMessage/:id',
            authenticateMiddleware([{"jwt":[]}]),
            upload.fields([
                {
                    name: "image",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(MessageController)),
            ...(fetchMiddlewares<RequestHandler>(MessageController.prototype.postMessage)),

            async function MessageController_postMessage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMessageController_postMessage, request, response });

                const controller = new MessageController();

              await templateService.apiHandler({
                methodName: 'postMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_getGroupList: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/group/list',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.getGroupList)),

            async function GroupController_getGroupList(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_getGroupList, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'getGroupList',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_createGroup: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateGroupBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/group/create',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.createGroup)),

            async function GroupController_createGroup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_createGroup, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'createGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_dissolveGroup: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.delete('/group/:id/dissolve',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.dissolveGroup)),

            async function GroupController_dissolveGroup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_dissolveGroup, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'dissolveGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_updateGroupAvatar: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                image: {"in":"formData","name":"image","dataType":"file"},
        };
        app.put('/group/:id/avatar',
            authenticateMiddleware([{"jwt":[]}]),
            upload.fields([
                {
                    name: "image",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.updateGroupAvatar)),

            async function GroupController_updateGroupAvatar(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_updateGroupAvatar, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'updateGroupAvatar',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_getGroupMessages: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/group/:id/messages',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.getGroupMessages)),

            async function GroupController_getGroupMessages(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_getGroupMessages, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'getGroupMessages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_markGroupMessagesRead: Record<string, TsoaRoute.ParameterSchema> = {
                groupId: {"in":"path","name":"groupId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"messageIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/group/:groupId/messages/markRead',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.markGroupMessagesRead)),

            async function GroupController_markGroupMessagesRead(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_markGroupMessagesRead, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'markGroupMessagesRead',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_searchGroupMessages: Record<string, TsoaRoute.ParameterSchema> = {
                q: {"in":"query","name":"q","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/group/messages/search',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.searchGroupMessages)),

            async function GroupController_searchGroupMessages(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_searchGroupMessages, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'searchGroupMessages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGroupController_sendGroupMessage: Record<string, TsoaRoute.ParameterSchema> = {
                groupId: {"in":"path","name":"groupId","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                text: {"in":"formData","name":"text","dataType":"string"},
                image: {"in":"formData","name":"image","dataType":"file"},
        };
        app.post('/group/:groupId/message',
            authenticateMiddleware([{"jwt":[]}]),
            upload.fields([
                {
                    name: "image",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(GroupController)),
            ...(fetchMiddlewares<RequestHandler>(GroupController.prototype.sendGroupMessage)),

            async function GroupController_sendGroupMessage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_sendGroupMessage, request, response });

                const controller = new GroupController();

              await templateService.apiHandler({
                methodName: 'sendGroupMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_signup: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"IUser"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/auth/signup',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.signup)),

            async function AuthController_signup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_signup, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'signup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"Pick_IUser.email-or-password_"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_logout: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/auth/logout',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.logout)),

            async function AuthController_logout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_logout, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'logout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_updateProfile: Record<string, TsoaRoute.ParameterSchema> = {
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.put('/auth/updateProfile',
            authenticateMiddleware([{"jwt":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.updateProfile)),

            async function AuthController_updateProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_updateProfile, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'updateProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_checkAuth: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/auth/checkAuth',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.checkAuth)),

            async function AuthController_checkAuth(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_checkAuth, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'checkAuth',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
