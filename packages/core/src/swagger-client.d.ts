// Объявление типов для swagger-client
declare module 'swagger-client' {
  export interface ResolveOptions {
    spec?: any;
    url?: string;
  }

  export interface SwaggerClient {
    resolve(options: ResolveOptions): Promise<any>;
    buildRequest(options: any): any;
    http(request: any): Promise<any>;
    execute(options: any): Promise<any>;
  }

  export default class SwaggerClient {
    static resolve(options: ResolveOptions): Promise<any>;
    static buildRequest(options: any): any;
    static http(request: any): Promise<any>;
    static execute(options: any): Promise<any>;
    constructor(options: ResolveOptions);
  }
}
