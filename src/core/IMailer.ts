
export interface IMail {
    to:string,
    from?:string,
    subject:string,
    text?:string,
    html?:string,
    attachments?: any
}

export interface IMailer {
    send(mail: IMail): Promise<boolean>;
}