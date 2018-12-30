"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise-native");
const bringApiUrl = "https://api.getbring.com/rest/v2/";
// Service to access the bring API
class BringApi {
    constructor(options) {
        this.cache = {};
        if (!options) {
            throw new Error("BringApi options missing!");
        }
        if (!options.username || !options.password) {
            throw new Error("Username/Password missing!");
        }
        if (!options.cacheDuration || options.cacheDuration < 0) {
            options.cacheDuration = 0;
        }
        this.options = options;
    }
    // Get all items from the current selected shopping list
    getDefaultList() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initLogin();
            if (!this.userContext) {
                throw new Error("login failed");
            }
            const list = yield this.getList(this.userContext.bringListUUID);
            return list;
        });
    }
    getLists() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initLogin();
            if (!this.userContext) {
                throw new Error("login failed");
            }
            return this.userContext.lists;
        });
    }
    getList(listUuid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initLogin();
            if (!this.userContext) {
                throw new Error("login failed");
            }
            const listDetails = this.userContext.lists.find((x) => x.uuid === listUuid);
            if (!listDetails) {
                return undefined;
            }
            const list = yield this._getResponse("get", "bringlists/" + listUuid);
            return {
                uuid: list.uuid,
                name: listDetails && listDetails.name || "-",
                items: list.purchase,
            };
        });
    }
    _initLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userContext) {
                // login
                const loginReponse = yield this._login();
                this.userContext = {
                    loginTimestamp: new Date().getTime(),
                    name: loginReponse.name,
                    email: loginReponse.email,
                    uuid: loginReponse.uuid,
                    bringListUUID: loginReponse.bringListUUID,
                    accessToken: loginReponse.access_token,
                    refreshToken: loginReponse.refresh_token,
                    expiresIn: loginReponse.expires_in,
                    photoPath: loginReponse.photoPath,
                    publicUuid: loginReponse.publicUuid,
                    lists: [],
                };
                // load lists
                const getListsResponse = yield this._getLists();
                this.userContext.lists = getListsResponse.lists.map((item) => ({
                    uuid: item.listUuid,
                    name: item.name,
                }));
            }
        });
    }
    _login() {
        return this._getResponse("post", "bringauth", "email=" + this.options.username + "&password=" + this.options.password);
    }
    _getLists() {
        return this._getResponse("get", "bringusers/" + this.userContext.uuid + "/lists");
    }
    // Save an item to your current shopping list
    // private saveItem(itemName: string, specification?: string) {
    //   return this.getResponse('put', "bringlists/" + this.bringListUUID, "purchase=" + itemName + "&recently=&specification=" + specification + "&remove=&sender=null");
    // }
    // // remove an item from your current shopping list
    // private removeItem(itemName: string) {
    //   return this.getResponse('put', "bringlists/" + this.bringListUUID, "purchase=&recently=&specification=&remove=" + itemName + "&sender=null");
    // }
    // // Search for an item
    // private searchItem(search: string) {
    //   return this.getResponse('get', "bringlistitemdetails/", "?listUuid=" + this.bringListUUID + "&itemId=" + search);
    // }
    // // Hidden Icons? Don't know what this is used for
    // private loadProducts() {
    //   return this.getResponse('get', "bringproducts");
    // }
    // // Found Icons? Don't know what this is used for
    // private loadFeatures() {
    //   return this.getResponse('get', "bringusers/" + this.bringUUID + "/features");
    // }
    // // Loads all shopping lists
    // private loadLists() {
    //   return this.getResponse('get', "bringusers/" + this.bringUUID + "/lists");
    // }
    // // Get all users from a shopping list
    // private getAllUsersFromList(listUUID: string) {
    //   return this.getResponse('get', "bringlists/" + listUUID + "/users");
    // }
    // private getUserSettings() {
    //   return this.getResponse('get', "bringusersettings/" + this.bringUUID);
    // }
    _getHeader() {
        // tslint:disable:no-string-literal
        const header = {
            "Origin": "https://web.getbring.com",
            "Referer": "https://web.getbring.com/login",
            // 'X-BRING-CLIENT-INSTANCE-ID': 'Web-xxxxxx',
            "X-BRING-API-KEY": "cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp",
            "X-BRING-CLIENT": "webApp",
            "X-BRING-CLIENT-SOURCE": "webApp",
            "X-BRING-COUNTRY": "DE",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
        };
        if (this.userContext) {
            header["X-BRING-USER-UUID"] = this.userContext.uuid;
            header["Authorization"] = "Bearer " + this.userContext.accessToken;
            header["Cookie"] = "refresh_token=" + this.userContext.refreshToken;
        }
        return header;
    }
    _getResponse(method, url, parameter, sendHeader = true) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("BringApi." + method + "(" + url + ")");
            const now = Date.now();
            const validCacheTime = now - (this.options.cacheDuration * 60 * 1000);
            url = bringApiUrl + url;
            if (method === "get" && parameter) {
                url += parameter;
            }
            // check timestamp - only cache get requests
            if (method !== "get" || this.cache[url] && this.cache[url].timestamp < validCacheTime) {
                delete (this.cache[url]);
            }
            if (!this.cache[url]) {
                const requestOptions = {
                    json: true,
                    resolveWithFullResponse: true,
                    rejectUnauthorized: false,
                    headers: sendHeader ? this._getHeader() : {},
                    body: method !== "get" ? encodeURI(parameter || "") : undefined,
                };
                let response;
                try {
                    switch (method) {
                        case "get":
                            response = yield request.get(url, requestOptions);
                            break;
                        case "put":
                            response = yield request.put(url, requestOptions);
                            break;
                        case "post":
                            requestOptions.headers["Content-Type"] = "application/x-www-form-urlencoded";
                            response = yield request.post(url, requestOptions);
                            break;
                    }
                    console.log(response && response.body);
                }
                catch (error) {
                    console.log(error);
                    throw new Error(JSON.stringify(error));
                }
                if (!response) {
                    throw new Error("no response");
                }
                if (response.statusCode !== 200) {
                    throw new Error(response.statusMessage);
                }
                this.cache[url] = {
                    timestamp: now,
                    result: response.body,
                    url,
                };
            }
            return this.cache[url].result;
        });
    }
}
exports.BringApi = BringApi;
//# sourceMappingURL=BringApi.js.map