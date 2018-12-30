export interface IBringApiOptions {
    username: string;
    password: string;
    cacheDuration: number;
}
export interface IShoppingListItem {
    name: string;
    specification?: string;
}
export interface IBringList {
    uuid: string;
    name: string;
}
export interface IShoppingList extends IBringList {
    items: IShoppingListItem[];
}
export declare class BringApi {
    readonly options: Readonly<IBringApiOptions>;
    private cache;
    private userContext?;
    constructor(options: IBringApiOptions);
    getDefaultList(): Promise<IShoppingList>;
    getLists(): Promise<IBringList[]>;
    getList(listUuid: string): Promise<IShoppingList | undefined>;
    private _initLogin;
    private _login;
    private _getLists;
    private _getHeader;
    private _getResponse;
}
