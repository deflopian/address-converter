import 'dotenv/config'
import { Mail } from './entities/mail'
import { createDecipheriv } from 'crypto'
import * as ical from 'node-ical'

import DictionaryAccepted from './reply-dictionaries/accepted'
import DictionaryDeclined from './reply-dictionaries/declined'
import DictionaryTentative from './reply-dictionaries/tentative'

const startsWith = (text: string, dictionary: string[]) => {
    return dictionary.find((needle) => {
        return text.startsWith(needle)
    })
}

// принимает на вход адрес, возвращает { directoryId, participantId }
export const parseReturnAddress = (address: string) => {
    const [ username, domain ] = address.split('@')
    if (!username || !domain) {
        throw new Error('wrong address')
    }

    const [ cipherText, tag, iv ] = username.split('+')
    if (!tag || !iv) {
        throw new Error('Part is missing')
    }

    const encryptionKey = process.env.ENCRYPTION_KEY || ''
    const encryptionKeyDecoded = Buffer.from(encryptionKey, 'base64')

    const cipher = 'aes-256-gcm'
    const cipherTextRaw = Buffer.from(cipherText, 'hex')
    const tagRaw = Buffer.from(tag, 'hex')
    const ivRaw = Buffer.from(iv, 'hex')

    const decipher = createDecipheriv(cipher, encryptionKeyDecoded, ivRaw)
    decipher.setAuthTag(tagRaw)
    const outputRaw = Buffer.concat([
        decipher.update(cipherTextRaw),
        decipher.final(),
    ])

    if (!outputRaw || outputRaw.length !== 12) {
        throw new Error('Decipher error')
    }

    const directoryId = outputRaw.readUInt32LE(0)
    const participantId = outputRaw.readBigInt64BE(4)

    return {
        directoryId: directoryId,
        participantId: participantId,
    }
}

export const getReplyStatus = (mail: Mail) => {
    const ACCEPTED = 'accepted'
    const DECLINED = 'declined'
    const TENTATIVE = 'tentative'

    let status = undefined

    // Проверяем тему письма
    if (startsWith(mail.subject, DictionaryAccepted)) {
        status = ACCEPTED
    } else if (startsWith(mail.subject, DictionaryDeclined)) {
        status = DECLINED
    } else if (startsWith(mail.subject, DictionaryTentative)) {
        status = TENTATIVE
    }

    if (status !== undefined) {
        return status
    }

    // Не нашли ответ в теме. Парсим прикреплённый файл
    const iCalAttachment = mail.attachments.find((attachment) => attachment.filename.endsWith('.ics'))
    if (!iCalAttachment) {
        throw new Error('This mail has no ical-attachment')
    }

    // ical.sync.parseFile(%FILENAME%), если прокидываем сюда только ссылку на файл, а не само содержимое
    const parsedICal = ical.sync.parseICS(iCalAttachment.contents)
    const replyEvents = Object.values(parsedICal).filter((event) => event.method === 'REPLY')
    if (!replyEvents.length) {
        throw new Error('There is no REPLY-event here')
    }
    for (const replyEvent of replyEvents) {
        /**
         * если не использовать any, возникает загадочная ошибка приведения типов внутри node-ical.d.ts
         * правильного решения я пока не нашёл
          */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attendee: any = replyEvent.attendee
        status = attendee?.params?.PARTSTAT?.toLowerCase()
        if (status !== undefined) {
            break
        }
    }

    if (![ACCEPTED, DECLINED, TENTATIVE].includes(status)) {
        throw new Error(`Unknown status "${status}"`)
    }

    return status
}
