import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
    env: "tutorial-1ccc6e",
    appSign: "AOJ8yAABTxnUe7iQA58"
});

const auth = app.auth({persistence: 'local'})

export function generateSmsCode() {
    let res = "";
    for (let i = 0; i < 4; i++) {
        res += Math.floor(Math.random() * 10).toString();
    }
    return res;
}

export async function sendEmail(email: string, code: string) {
    await auth.anonymousAuthProvider().signIn()
    const res = await app.callFunction({
      name: "email",
      data: {
        'actionType': 'SEND_EMAIL',
        'email': email,
        'languageCode': 'zh',
        'verificationCode': code,
      }
    })

    return res
}