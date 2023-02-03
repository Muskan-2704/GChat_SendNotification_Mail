function authorize() {
    const redirectURL = chrome.identity.getRedirectURL(); 
    const clientId = '160303188104-55fs48vnsi2ufneuku2172pfeac9tlm9.apps.googleusercontent.com';
    const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'token',
        redirect_uri: redirectURL,
        scope: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' '),
    });

const authURL = `https://accounts.google.com/o/oauth2/auth?${authParams.toString()}`;
chrome.identity.launchWebAuthFlow({ url: authURL, interactive: true }).then((responseUrl) => {
    const url = new URL(responseUrl);
    const urlParams = new URLSearchParams(url.hash.slice(1));
    const params = Object.fromEntries(urlParams.entries());
    var accessToken = params['access_token'];
    var expireIn = params['expires_in'];
    let expiryDateTime = new Date();
    var obj = {
        token : accessToken,
        expireTime: expiryDateTime.setSeconds(expiryDateTime.getSeconds() + parseInt(expireIn)-60)
    }
    fetch('https://www.googleapis.com/oauth2/v2/userinfo?access_token='+accessToken)
    .then(r=> r.json())
    .then(r=>{ 
        chrome.storage.local.set(r).then(()=> {});
    });
    chrome.storage.local.set(obj).then(() => {});
  });
}

authorize();
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request) {
            if (request.message) {
                //chrome.identity.clearAllCachedAuthTokens();
                authorize();
                sendResponse({message:"done"})
            }
        }
        return true;
    }
)