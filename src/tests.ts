import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MailAttachment } from './entities/mail-attachment'
import { Mail } from './entities/mail'
import { getReplyStatus, parseReturnAddress } from './address-converter'

const tests = [
    {
        address: 'd9c3e969602a9d23b363157e+105faa3fbade9ccd+9296a80997fbfd0ca1157d02@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '285130631870947332',
        },
    },
    {
        address: '88ead36a44ff5854c5ce9484+c51f2e01af345cb0+f9d54e1e1cb943c55e00f19c@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '284004883663691778',
        },
    },
    {
        address: '23cc06d7d5280fb05f3ab1d3+a94cc9f266efacca+eb6bc618dd93feef0f1b2e10@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '283948268801499138',
        },
    },
    {
        address: 'edb13d19e218640be9e424cc+6aee7bf3642a8b9e+a8bd69fdd5e4278baf4eb520@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '282162486231179265',
        },
    },
    {
        address: '4ba15b76dd043dc364ed86bf+feb70881717ef800+fd1f8c6d450a71a76858584f@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '279697380725497858',
        },
    },
    {
        address: 'f6bb4f4d1dbefaeb7bae155c+2d9a9f17a1f0e9ed+84afd3c26badfd83d1c0991b@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '289849252245413888',
        },
    },
    {
        address: 'dbc4a72612a05764511ce349+a9481706b95ab09c+a3e1c63b5a50c88668194181@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '289849252270579712',
        },
    },
    {
        address: '8d47ba3e56c577d7d76b726d+994a2d571679c0e6+8bd67d8aa55019d2d806cc39@calendar.beaconx.com',
        results: {
            directoryId: 1,
            participantId: '286612919884455936',
        },
    },
    {
        address: 'f07ece1fb04fe5738032ac89+d178b7d6a43d2540+75d284b344504bddd1897412@calendar.beaconx.com',
        results: {
            directoryId: 350,
            participantId: '185908264811489138',
        },
    },
]

console.log('Проверяем адреса:')
tests.forEach((test, index) => {
    try {
        const { directoryId, participantId } = parseReturnAddress(test.address)
        const res = directoryId === test.results.directoryId && participantId.toString() === test.results.participantId

        if (res) {
            console.info(`[OK] test ${index}`)
        } else {
            console.error(`test ${index}: ${res}`)
            console.warn(`address: ${test.address}`)
            console.warn(`directoryId: ${directoryId}/${ test.results.directoryId}`)
            console.warn(`participantId: ${participantId}/${ test.results.participantId}`)
        }
    } catch (error) {
        console.error(error)
    }
})

console.log('Проверяем ошибочный адрес')
try {
    const address = 'wrong+address@calendar.beaconx.com'
    const { directoryId, participantId } = parseReturnAddress(address)

    console.warn(`address: ${address}`)
    console.warn(`directoryId: ${directoryId}`)
    console.warn(`participantId: ${participantId}`)
} catch (error) {
    console.log(`[ОК] ${error}`)
}

console.log('Проверяем поддельный адрес')
try {
    const address = 'f6bb4f4d1dbefaeb7bae155c+5d9a9f17a1f0e9ed+84afd3c26badfd83d1c0991b@calendar.beaconx.com'
    const { directoryId, participantId } = parseReturnAddress(address)

    console.warn(`address: ${address}`)
    console.warn(`directoryId: ${directoryId}`)
    console.warn(`participantId: ${participantId}`)
} catch (error) {
    console.log(`[ОК] ${error}`)
}


const attachments = [
    'event.ics',
    'iCal-Reply.ics',
    'invite.ics',
    'invite-declined.ics',
    'reply.ics',
]
const subjects = [
    'event accepted: yeah baby',
    'отклонено: ваше приглашение нас не интересует',
    'provisoire : уговаривайте нас подольше!',
]
console.log('Тестируем ответы')
console.log('Темы письма:')
subjects.forEach((subject) => {
    try {
        const mail = new Mail(subject, 'mail body', [])
        const status = getReplyStatus(mail)
        console.log(`Тема: "${subject}"; Ответ: "${status}"`)
    } catch (error) {
        console.error(error)
    }
})
console.log('Прикреплённые файлы:')
attachments.forEach((filename) => {
    try {
        const attachmentContent = readFileSync(resolve(__dirname, `../assets/attachments/${filename}`), 'utf-8')
        const mail = new Mail('hello there', 'mail body', [
            new MailAttachment('reply', filename, attachmentContent),
        ])
        const status = getReplyStatus(mail)
        console.log(`Файл: "${filename}"; Ответ: "${status}"`)
    } catch (error) {
        console.error(error)
    }
})
console.log('Письмо без файла, с ответом в теле письма:')
try {
    const mail = new Mail('hello there', 'We honorably accept your invitation', [])
    const status = getReplyStatus(mail)
    console.log(`Ответ: "${status}"`)
} catch (error) {
    console.log(`[Ок] ${error}`)
}
