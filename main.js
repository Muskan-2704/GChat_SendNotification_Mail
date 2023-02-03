let MAX_TRY = 30;
let NUMBER_OF_TRY = 0;
let GMAIL_MESSAGE_SEND_API = `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`;
export const app = async ()=> {
    await init();
}

let EMAIL_BODY = `<div>
                    <span>Dear ##recepientName,</span>
                    <br/>
                    <br/>
                    <span>##senderFirstName is trying to reach you on Google Chat. To view and respond to the message, please onboard now to Google chat by <a href = "https://mail.google.com/chat" target = "_blank">CLICKING HERE</a>.</span>
                    <br/>
                    <span>Click <a href="https://googleonboarding.fresco.me/" target="_blank">Google Portal</a> to access FAQs, Resources, and Tutorials on GWS applications. 

                    For any further queries, contact write to <a href = "mailto:gws.support@tcs.com">gws.support@tcs.com</a>
                    </span>
                    <br/>
                    <br/>
                    <span>Regards,</span>
                    <br/>
                    <span>##senderName</span>
                </div>`;
let EMAIL_SUBJECT = 'Attention! Your response is awaited on Google Chat';

const init = async () => {  
    let location = window.location.href;
    if (location.startsWith('https://chat.google.com'))  
        setTimeout(checkChatTabLoaded, 3000);
}

const checkChatTabLoaded = () => {
    NUMBER_OF_TRY++;
    let currentFrameUrl = location.href;
    if(currentFrameUrl.indexOf('gtn-roster-iframe') > 0) {
        let mainBox = document.querySelector('.wYx9me [jsaction="JIbuQc:tAVMpd"]');
        if(mainBox){
            //let flexBox = mainBox.querySelector('[jsaction="JIbuQc:tAVMpd"]');
            let btnDiv = document.createElement('div');
            btnDiv.setAttribute('class','Uf7Zse');
            btnDiv.innerHTML = `<div role="button" class="U26fgb mUbCce fKz7Od hA9Mmb M9Bg4d">
                <div class="VTBa7b MbhUzd" jsname="ksKsZd"></div>
                <span jsslot="" class="xjKiLb">
                    <span class="Ce1Y1c" style="top: -10px;">
                    <svg width="28" height="24" class="GfYBMd iNfgyc" viewBox="0 0 16 16"> <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"></path></svg>
                    </span>
                </span>
            </div>`;
            mainBox.append(btnDiv);
            btnDiv.addEventListener('click', sendEmail);
        }
        else if(NUMBER_OF_TRY < MAX_TRY) {
            setTimeout(checkChatTabLoaded, 1000);
        }
    }
}

const sendEmail = async () => {
    // Getting email and name
    let receipientEmailElement = document.querySelector('span.ue8vk').innerText;
    let receipientNameElement = document.querySelector('span.CmMf8e.cQ7fXb[role=heading]').innerText;

    chrome.storage.local.get(["token", "expireTime", "email", "name", "given_name", receipientEmailElement]).then(async (result) =>
    {
        let currentTime = new Date().getTime();
        if (result.expireTime > currentTime) {
            let requestObject = {
                method : 'POST',
                async: true,
                headers: {
                    Authorization: 'Bearer ' + result.token,
                    'Content-Type': 'application/json'
                },
                'emailObject':{
                    'To': receipientEmailElement == receipientNameElement ? `<${receipientEmailElement}>`:`${receipientNameElement} <${receipientEmailElement}>`,
                    'From':`${result.name} <${result.email}>`,
                    'Date' : new Date().toUTCString(),
                    'Subject': EMAIL_SUBJECT,
                    'Content-Type': 'text/html; charset=UTF-8',
                    'Recipient_Email' : receipientEmailElement,
                    'Body' : EMAIL_BODY.replace('##senderName',result.name).replace('##recepientName',receipientNameElement).replace('##senderFirstName',result.given_name)
                }
            }
            if (result[receipientEmailElement] == undefined)
            {
                requestObject.emailObject["no_of_Email"] = 3;
                await sendEmailAPI(requestObject);
            }
            else {
                let left_email = result[receipientEmailElement].no_of_Email;
                if( !(left_email < 1))
                {
                    requestObject.emailObject["no_of_Email"] = left_email;
                    await sendEmailAPI(requestObject);
                }
                else if(result[receipientEmailElement].date != (new Date().toDateString()))
                {
                    requestObject.emailObject["no_of_Email"] = 3;
                    await sendEmailAPI(requestObject);
                }
                else 
                {
                    alert("Daily limit reached");

                }

            }
        }
        else {
            chrome.runtime.sendMessage("njejefdkfeocinhlidbebacljpmmamfd", {message:"Auth"}, function(reply){
                console.log(reply);
            });
        }
    });
    

};

const sendEmailAPI = async (reqObj) => {
        let emailObject = reqObj.emailObject;
        delete reqObj["emailObject"];
        var encodedEmail = btoa(
            'From: ' + emailObject.From + '\r\n' +
            'To: ' + emailObject.To + '\r\n' +
            'Date: ' + emailObject.Date +'\r\n'+
            'Subject: ' + emailObject.Subject + '\r\n' +       
            'Content-Type: ' + emailObject["Content-Type"] + '\r\n\r\n' +
            emailObject.Body 
        );
        let Recipient_Email = emailObject.Recipient_Email;
        reqObj["body"] = JSON.stringify({ raw: encodedEmail });
        let recObj = {};
        recObj[Recipient_Email] = {
            no_of_Email: emailObject.no_of_Email-1,
            date: new Date().toDateString()
        }
        chrome.storage.local.set(recObj).then(()=>{})
        fetch(GMAIL_MESSAGE_SEND_API, reqObj).then(x=>{
            
            alert(`Notification Email Send to ${emailObject.To.replace('<','').replace('>','')}`);
        }).catch(err => console.log(err));
        

    }
