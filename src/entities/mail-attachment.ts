export class MailAttachment {
    name: string
    filename: string
    contents: string

    constructor(name: string, filename: string, contents: string) {
        this.name = name
        this.filename = filename
        this.contents = contents
    }
}
