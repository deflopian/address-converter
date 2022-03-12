import { MailAttachment } from './mail-attachment'

export class Mail {
    subject: string
    body: string
    attachments: MailAttachment[]

    constructor(subject: string, body: string, attachments: MailAttachment[]) {
        this.subject = subject
        this.body = body
        this.attachments = attachments
    }
}
